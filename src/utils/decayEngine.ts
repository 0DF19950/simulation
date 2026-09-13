/**
 * Radioactive decay, one atom at a time.
 *
 * Every earlier engine was deterministic: the same inputs gave the same
 * answer. This one can't be, because the physics isn't — each atom decays at
 * a random moment. It follows the lesson's own loop literally: for every atom,
 * every step, draw a random number and compare it with that atom's decay
 * probability for the step. The smooth curve of Part 3 is what that
 * randomness averages to, so the exact expectations (N₀e^(−λt), and the
 * Bateman solution for chains) are computed alongside every run to check it.
 */

const LN2 = Math.LN2;

export type StepRule = 'exact' | 'simple';

export interface ChainSpec {
  /** Half-lives of the radioactive members, parent first, in days. A stable end member is implied. */
  halfLives: number[];
  initialAtoms: number;
}

export interface DecayParams {
  chains: ChainSpec[];
  duration: number; // days
  steps: number;
  /**
   * 'exact': an atom decays within a step with probability 1 − e^(−λΔt), and a
   * daughter born partway through a step gets the rest of that step to decay
   * in turn, so runs match the exact curves at any step size.
   * 'simple': the naive loop, p = λΔt and one test per atom per step. Fine for
   * tiny steps; coarse ones decay too fast and make every new daughter sit out
   * the step it was born in.
   */
  rule: StepRule;
  seed: number;
  /** How many atoms to record each step for the jar view. */
  jarSize: number;
}

export interface Member {
  chain: number;
  position: number; // 0 is the parent
  halfLife: number | null; // null for the stable end member
}

export interface DecayRun {
  members: Member[];
  times: Float64Array; // days, one entry per step boundary
  /** Simulated atom counts per member, per step. */
  simulated: Float64Array[];
  /** Exact expected counts per member, per step (the large-sample limit). */
  expected: Float64Array[];
  /** Member index of each recorded atom, per step: jar[step * jarAtoms + atom]. */
  jar: Uint8Array;
  jarAtoms: number;
  totalAtoms: number;
  dt: number; // days
}

/** Small, fast, seedable PRNG, so a run can be reproduced exactly. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bateman's formula divides by differences of decay constants, so nudge repeats apart by a part per million. */
function distinctRates(halfLives: number[]): number[] {
  const out: number[] = [];
  for (const h of halfLives) {
    let v = LN2 / h;
    while (out.some((u) => Math.abs(u - v) <= 1e-9 * Math.max(u, v))) v *= 1 + 1e-6;
    out.push(v);
  }
  return out;
}

/**
 * Bateman solution for a linear chain starting with n0 parent atoms: the
 * expected number of each radioactive member at time t. With one member it
 * reduces to Part 3's N₀e^(−λt).
 */
export function batemanChain(halfLives: number[], n0: number, t: number): number[] {
  const lam = distinctRates(halfLives);
  const out: number[] = [];
  for (let k = 0; k < lam.length; k++) {
    let rates = 1;
    for (let i = 0; i < k; i++) rates *= lam[i];
    let sum = 0;
    for (let i = 0; i <= k; i++) {
      let denom = 1;
      for (let j = 0; j <= k; j++) if (j !== i) denom *= lam[j] - lam[i];
      sum += Math.exp(-lam[i] * t) / denom;
    }
    out.push(n0 * rates * sum);
  }
  return out;
}

export function runDecay(p: DecayParams): DecayRun {
  const dt = p.duration / p.steps;
  const members: Member[] = [];
  const firstOfChain: number[] = [];
  p.chains.forEach((c, ci) => {
    firstOfChain.push(members.length);
    c.halfLives.forEach((h, k) => members.push({ chain: ci, position: k, halfLife: h }));
    members.push({ chain: ci, position: c.halfLives.length, halfLife: null });
  });

  const next = members.map((m, i) => (m.halfLife === null ? i : i + 1));
  const lambda = members.map((m) => (m.halfLife === null ? 0 : LN2 / m.halfLife));
  const probability = lambda.map((l) => (p.rule === 'exact' ? 1 - Math.exp(-l * dt) : Math.min(1, l * dt)));

  // Lay the atoms out, then shuffle, so the first atoms of a mixed sample
  // (the ones the jar shows) are a fair mix of both isotopes.
  const totalAtoms = p.chains.reduce((s, c) => s + c.initialAtoms, 0);
  const state = new Uint8Array(totalAtoms);
  let o = 0;
  p.chains.forEach((c, ci) => {
    for (let a = 0; a < c.initialAtoms; a++) state[o++] = firstOfChain[ci];
  });
  const rand = mulberry32(p.seed);
  for (let i = totalAtoms - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = state[i];
    state[i] = state[j];
    state[j] = tmp;
  }

  const counts = new Float64Array(members.length);
  for (let a = 0; a < totalAtoms; a++) counts[state[a]]++;

  const simulated = members.map(() => new Float64Array(p.steps + 1));
  const jarAtoms = Math.min(p.jarSize, totalAtoms);
  const jar = new Uint8Array((p.steps + 1) * jarAtoms);
  const record = (s: number) => {
    for (let i = 0; i < members.length; i++) simulated[i][s] = counts[i];
    jar.set(state.subarray(0, jarAtoms), s * jarAtoms);
  };

  record(0);
  for (let s = 1; s <= p.steps; s++) {
    if (p.rule === 'simple') {
      // One test per atom, in the state it began the step in.
      for (let a = 0; a < totalAtoms; a++) {
        const m = state[a];
        if (probability[m] > 0 && rand() < probability[m]) {
          state[a] = next[m];
          counts[m]--;
          counts[next[m]]++;
        }
      }
    } else {
      for (let a = 0; a < totalAtoms; a++) {
        let m = state[a];
        let remaining = dt;
        while (lambda[m] > 0) {
          const chance = remaining === dt ? probability[m] : 1 - Math.exp(-lambda[m] * remaining);
          if (rand() >= chance) break;
          // It decays within the time left: place that moment inside the window
          // (inverse of the truncated exponential), and hand the rest of the step
          // to the daughter. Waiting times are memoryless, so this is exact.
          remaining -= -Math.log(1 - rand() * chance) / lambda[m];
          counts[m]--;
          m = next[m];
          counts[m]++;
        }
        state[a] = m;
      }
    }
    record(s);
  }

  const times = new Float64Array(p.steps + 1);
  const expected = members.map(() => new Float64Array(p.steps + 1));
  for (let s = 0; s <= p.steps; s++) {
    const t = s * dt;
    times[s] = t;
    p.chains.forEach((c, ci) => {
      const radioactive = batemanChain(c.halfLives, c.initialAtoms, t);
      let sum = 0;
      radioactive.forEach((v, k) => {
        expected[firstOfChain[ci] + k][s] = v;
        sum += v;
      });
      expected[firstOfChain[ci] + c.halfLives.length][s] = c.initialAtoms - sum;
    });
  }

  return { members, times, simulated, expected, jar, jarAtoms, totalAtoms, dt };
}

/** First time a curve falls to `level`, interpolated between steps; null if it never does. */
export function crossingTime(times: Float64Array, values: Float64Array, level: number): number | null {
  for (let s = 1; s < values.length; s++) {
    if (values[s] <= level && values[s - 1] > level) {
      const f = (values[s - 1] - level) / (values[s - 1] - values[s]);
      return times[s - 1] + f * (times[s] - times[s - 1]);
    }
  }
  return null;
}

/** Largest value of a curve and when it happens. */
export function peakOf(times: Float64Array, values: Float64Array): { time: number; value: number } {
  let best = 0;
  for (let s = 1; s < values.length; s++) if (values[s] > values[best]) best = s;
  return { time: times[best], value: values[best] };
}

/**
 * Survivors of a single isotope across repeated samples. One draw per atom per
 * trial is exact here: surviving every step of a run is the same event as
 * surviving to the end, with probability `survival`.
 */
export function survivorSpread(n0: number, survival: number, trials: number, seed: number) {
  const rand = mulberry32(seed);
  const values: number[] = [];
  for (let k = 0; k < trials; k++) {
    let alive = 0;
    for (let a = 0; a < n0; a++) if (rand() < survival) alive++;
    values.push(alive);
  }
  const mean = values.reduce((s, v) => s + v, 0) / trials;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, trials - 1));
  return { values, mean, std, predictedStd: Math.sqrt(n0 * survival * (1 - survival)) };
}
