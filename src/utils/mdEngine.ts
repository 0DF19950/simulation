/**
 * Molecular dynamics: atoms pushing and pulling on each other, stepped forward
 * in time.
 *
 * Units follow the lesson: separations in nanometres, energies in meV, time in
 * picoseconds, speeds in nm/ps (1 nm/ps = 1000 m/s), masses in atomic mass
 * units. The integrator is velocity Verlet, the standard in MD codes, because
 * it keeps the total energy steady over long runs; explicit Euler is kept for
 * contrast. Forces are summed over every pair with no cutoff, so the energy
 * check is exact rather than blurred by a truncated potential.
 */

/** 1 u·(nm/ps)² in meV: turns ½mv² into meV and F/m into nm/ps². */
export const MASS_UNIT = 10.3643;
/** Boltzmann's constant, meV per kelvin. */
export const KB = 0.08617333;
/** Argon, the classic Lennard-Jones atom: ε/k_B ≈ 120 K. */
export const ARGON = { epsilon: 10.3, sigma: 0.34, massU: 39.95 } as const;

export type MdIntegrator = 'verlet' | 'euler';

export interface MdAtom {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface MdParams {
  atoms: MdAtom[];
  /** Well depth, meV. */
  epsilon: number;
  /** Effective atom size, nm. */
  sigma: number;
  /** Mass of each atom, u. */
  massU: number;
  /** Time step, ps. */
  dt: number;
  steps: number;
  integrator: MdIntegrator;
  /** Soft walls around a square box from 0 to `box` nm on both axes; omit for open space. */
  box?: number;
  maxFrames?: number;
}

export interface MdRun {
  n: number;
  nFrames: number;
  /** positions[(frame * n + i) * 2] is atom i's x in nm, the next entry its y. */
  positions: Float64Array;
  times: Float64Array;
  kinetic: Float64Array;
  potential: Float64Array;
  total: Float64Array;
  /** Largest |E − E₀| over the recorded frames, meV. */
  maxEnergyError: number;
  /** When the energy ran away and the run was stopped early, ps — Euler can do this. */
  blewUpAt: number | null;
}

export const ljPotential = (r: number, epsilon: number, sigma: number): number => {
  const s6 = (sigma / r) ** 6;
  return 4 * epsilon * (s6 * s6 - s6);
};

/** F = −dU/dr, meV/nm: positive pushes the atoms apart, negative pulls them together. */
export const ljForce = (r: number, epsilon: number, sigma: number): number => {
  const s6 = (sigma / r) ** 6;
  return ((24 * epsilon) / r) * (2 * s6 * s6 - s6);
};

export const equilibriumSeparation = (sigma: number): number => 2 ** (1 / 6) * sigma;

interface Walls {
  size: number;
  inset: number;
  k: number;
}

function computeForces(
  x: Float64Array,
  y: Float64Array,
  n: number,
  epsilon: number,
  sigma: number,
  walls: Walls | null,
  fx: Float64Array,
  fy: Float64Array
): number {
  fx.fill(0);
  fy.fill(0);
  let pe = 0;
  const s2 = sigma * sigma;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = x[i] - x[j];
      const dy = y[i] - y[j];
      const r2 = dx * dx + dy * dy;
      const inv2 = s2 / r2;
      const s6 = inv2 * inv2 * inv2;
      pe += 4 * epsilon * (s6 * s6 - s6);
      const fOverR = (24 * epsilon * (2 * s6 * s6 - s6)) / r2;
      fx[i] += fOverR * dx;
      fy[i] += fOverR * dy;
      fx[j] -= fOverR * dx;
      fy[j] -= fOverR * dy;
    }
    // Soft, springy walls: conservative, so the energy check still holds in a box.
    if (walls) {
      const lo = walls.inset;
      const hi = walls.size - walls.inset;
      if (x[i] < lo) { const d = lo - x[i]; fx[i] += walls.k * d; pe += 0.5 * walls.k * d * d; }
      if (x[i] > hi) { const d = x[i] - hi; fx[i] -= walls.k * d; pe += 0.5 * walls.k * d * d; }
      if (y[i] < lo) { const d = lo - y[i]; fy[i] += walls.k * d; pe += 0.5 * walls.k * d * d; }
      if (y[i] > hi) { const d = y[i] - hi; fy[i] -= walls.k * d; pe += 0.5 * walls.k * d * d; }
    }
  }
  return pe;
}

export function runMd(p: MdParams): MdRun {
  const n = p.atoms.length;
  const x = Float64Array.from(p.atoms, (a) => a.x);
  const y = Float64Array.from(p.atoms, (a) => a.y);
  const vx = Float64Array.from(p.atoms, (a) => a.vx);
  const vy = Float64Array.from(p.atoms, (a) => a.vy);
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);
  const { epsilon, sigma, dt } = p;
  const m = p.massU * MASS_UNIT;
  const walls = p.box === undefined ? null : { size: p.box, inset: 0.5 * sigma, k: (50 * epsilon) / (sigma * sigma) };

  const recordEvery = Math.max(1, Math.ceil(p.steps / (p.maxFrames ?? 1500)));
  const capacity = Math.floor(p.steps / recordEvery) + 1;
  const positions = new Float64Array(capacity * n * 2);
  const times = new Float64Array(capacity);
  const kinetic = new Float64Array(capacity);
  const potential = new Float64Array(capacity);
  const total = new Float64Array(capacity);
  // Far beyond anything a stable run reaches: 50 ε per atom of drift means the integrator has failed.
  const runaway = 50 * epsilon * n;

  let pe = computeForces(x, y, n, epsilon, sigma, walls, fx, fy);
  let frame = 0;
  let e0 = 0;
  let maxEnergyError = 0;
  let blewUpAt: number | null = null;

  const record = (step: number): boolean => {
    let ke = 0;
    for (let i = 0; i < n; i++) ke += vx[i] * vx[i] + vy[i] * vy[i];
    ke *= 0.5 * m;
    const e = ke + pe;
    if (frame === 0) e0 = e;
    else if (!(Math.abs(e - e0) < runaway)) return false; // also catches NaN
    for (let i = 0; i < n; i++) {
      positions[(frame * n + i) * 2] = x[i];
      positions[(frame * n + i) * 2 + 1] = y[i];
    }
    times[frame] = step * dt;
    kinetic[frame] = ke;
    potential[frame] = pe;
    total[frame] = e;
    maxEnergyError = Math.max(maxEnergyError, Math.abs(e - e0));
    frame++;
    return true;
  };
  record(0);

  for (let step = 1; step <= p.steps; step++) {
    if (p.integrator === 'verlet') {
      for (let i = 0; i < n; i++) {
        vx[i] += (0.5 * dt * fx[i]) / m;
        vy[i] += (0.5 * dt * fy[i]) / m;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      }
      pe = computeForces(x, y, n, epsilon, sigma, walls, fx, fy);
      for (let i = 0; i < n; i++) {
        vx[i] += (0.5 * dt * fx[i]) / m;
        vy[i] += (0.5 * dt * fy[i]) / m;
      }
    } else {
      for (let i = 0; i < n; i++) {
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        vx[i] += (dt * fx[i]) / m;
        vy[i] += (dt * fy[i]) / m;
      }
      pe = computeForces(x, y, n, epsilon, sigma, walls, fx, fy);
    }
    if (step % recordEvery === 0 && !record(step)) {
      blewUpAt = step * dt;
      break;
    }
  }

  return {
    n,
    nFrames: frame,
    positions: positions.subarray(0, frame * n * 2),
    times: times.subarray(0, frame),
    kinetic: kinetic.subarray(0, frame),
    potential: potential.subarray(0, frame),
    total: total.subarray(0, frame),
    maxEnergyError,
    blewUpAt,
  };
}

export const distanceAt = (run: MdRun, frame: number, i: number, j: number): number => {
  const a = (frame * run.n + i) * 2;
  const b = (frame * run.n + j) * 2;
  return Math.hypot(run.positions[a] - run.positions[b], run.positions[a + 1] - run.positions[b + 1]);
};

// ─── Two atoms: the exact answer ─────────────────────────────────────────────

/** Two equal atoms on the x-axis with the centre of mass at rest, closing at `approach` nm/ps. */
export const pairAtoms = (r0: number, approach: number): MdAtom[] => [
  { x: -r0 / 2, y: 0, vx: approach / 2, vy: 0 },
  { x: r0 / 2, y: 0, vx: -approach / 2, vy: 0 },
];

/** Energy of head-on relative motion, meV: U(r₀) + ½μv², with μ = m/2 for equal masses. */
export const pairEnergy = (r0: number, approach: number, epsilon: number, sigma: number, massU: number): number =>
  ljPotential(r0, epsilon, sigma) + 0.5 * (0.5 * massU * MASS_UNIT) * approach * approach;

/** 10 fs, or less when the atoms will meet fast: at most 1% of σ per step at the fastest moment. */
export function pairTimeStep(energy: number, epsilon: number, sigma: number, massU: number): number {
  const mu = 0.5 * massU * MASS_UNIT;
  const vMax = Math.sqrt((2 * Math.max(0, energy + epsilon)) / mu);
  return Math.min(0.01, (0.01 * sigma) / Math.max(vMax, 1e-9));
}

/**
 * Turning points of head-on relative motion with energy E: the solutions of
 * U(r) = E. `outer` is null when E ≥ 0 — the atoms never turn back.
 */
export function turningPoints(E: number, epsilon: number, sigma: number): { inner: number; outer: number | null } {
  const rm = equilibriumSeparation(sigma);
  if (E <= -epsilon) return { inner: rm, outer: rm };
  const bisect = (lo: number, hi: number, rising: boolean) => {
    for (let k = 0; k < 200; k++) {
      const mid = 0.5 * (lo + hi);
      if (ljPotential(mid, epsilon, sigma) > E === rising) hi = mid;
      else lo = mid;
    }
    return 0.5 * (lo + hi);
  };
  // U falls from +∞ to −ε on (0, r_min), then climbs back towards 0 beyond it.
  let near = 0.9 * sigma;
  while (ljPotential(near, epsilon, sigma) <= E) near *= 0.9;
  const inner = bisect(near, rm, false);
  if (E >= 0) return { inner, outer: null };
  let far = 2 * rm;
  while (ljPotential(far, epsilon, sigma) <= E) far *= 2;
  return { inner, outer: bisect(rm, far, true) };
}

/**
 * Exact oscillation period of a bound pair from energy conservation alone:
 * T = 2∫dr/v between the turning points, v = √(2(E − U)/μ). The substitution
 * r = c + h·sin φ removes the endpoint singularities.
 */
export function exactPeriod(E: number, reducedMassU: number, epsilon: number, sigma: number, samples = 4000): number | null {
  const { inner, outer } = turningPoints(E, epsilon, sigma);
  if (outer === null || outer <= inner) return null;
  const mu = reducedMassU * MASS_UNIT;
  const c = 0.5 * (inner + outer);
  const h = 0.5 * (outer - inner);
  const dphi = Math.PI / samples;
  let sum = 0;
  for (let k = 0; k < samples; k++) {
    const phi = -Math.PI / 2 + (k + 0.5) * dphi;
    const r = c + h * Math.sin(phi);
    const kinetic = E - ljPotential(r, epsilon, sigma);
    if (kinetic > 0) sum += (h * Math.cos(phi) * dphi) / Math.sqrt((2 * kinetic) / mu);
  }
  return 2 * sum;
}

/** Mean time between successive maxima of a sampled signal, each refined by a parabola through three samples. */
export function measuredPeriod(times: ArrayLike<number>, values: ArrayLike<number>): number | null {
  const peaks: number[] = [];
  for (let k = 1; k < values.length - 1; k++) {
    if (values[k] > values[k - 1] && values[k] >= values[k + 1]) {
      const a = values[k - 1];
      const b = values[k];
      const c = values[k + 1];
      const curve = a - 2 * b + c;
      const shift = curve !== 0 ? (0.5 * (a - c)) / curve : 0;
      peaks.push(times[k] + shift * (times[k + 1] - times[k]));
    }
  }
  return peaks.length < 2 ? null : (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
}

export interface PairAnalysis {
  energy: number;
  bound: boolean;
  exactInner: number;
  exactOuter: number | null;
  exactPeriod: number | null;
  runInner: number;
  runOuter: number;
  runPeriod: number | null;
}

/** The run measured against the exact two-body answer. Assumes the centre of mass is at rest. */
export function analysePair(run: MdRun, epsilon: number, sigma: number, massU: number): PairAnalysis {
  const energy = run.total[0];
  const tp = turningPoints(energy, epsilon, sigma);
  const r = new Float64Array(run.nFrames);
  for (let f = 0; f < run.nFrames; f++) r[f] = distanceAt(run, f, 0, 1);
  let runInner = Infinity;
  let runOuter = -Infinity;
  for (const v of r) {
    runInner = Math.min(runInner, v);
    runOuter = Math.max(runOuter, v);
  }
  return {
    energy,
    bound: energy < 0,
    exactInner: tp.inner,
    exactOuter: tp.outer,
    exactPeriod: exactPeriod(energy, massU / 2, epsilon, sigma),
    runInner,
    runOuter,
    runPeriod: energy < 0 ? measuredPeriod(run.times, r) : null,
  };
}

// ─── Three atoms: sensitivity ────────────────────────────────────────────────

/**
 * A vibrating pair (atoms 0 and 1, on the y-axis) and a third atom fired at it
 * along x from six atom-widths away, `aim` nm off-centre. The pair moves back
 * a little so the centre of mass stays put.
 */
export function shooterTrio(sigma: number, speed: number, aim: number, nudge = 0): MdAtom[] {
  const half = 0.48 * equilibriumSeparation(sigma);
  return [
    { x: 0, y: -half, vx: -speed / 3, vy: 0 },
    { x: 0, y: half, vx: -speed / 3, vy: 0 },
    { x: -6 * sigma, y: aim + nudge, vx: (2 * speed) / 3, vy: 0 },
  ];
}

export type TrioOutcome =
  | { kind: 'ejected'; atom: number; time: number }
  | { kind: 'apart'; time: number }
  | { kind: 'together' };

/** How a three-atom run ends: which atom is left out on its own (more than 3σ from both others), and since when. */
export function trioOutcome(run: MdRun, sigma: number): TrioOutcome {
  const far = 3 * sigma;
  const loneAt = (f: number): number => {
    const ab = distanceAt(run, f, 0, 1);
    const ac = distanceAt(run, f, 0, 2);
    const bc = distanceAt(run, f, 1, 2);
    if (ab > far && ac > far && bc > far) return -2;
    if (ac > far && bc > far) return 2;
    if (ab > far && bc > far) return 1;
    if (ab > far && ac > far) return 0;
    return -1;
  };
  const last = run.nFrames - 1;
  const final = loneAt(last);
  if (final === -1) return { kind: 'together' };
  let f = last;
  while (f > 0 && loneAt(f - 1) === final) f--;
  const time = run.times[f];
  return final === -2 ? { kind: 'apart', time } : { kind: 'ejected', atom: final, time };
}

/** Largest distance between matching atoms of two runs, frame by frame, nm. */
export function twinGap(a: MdRun, b: MdRun): Float64Array {
  const frames = Math.min(a.nFrames, b.nFrames);
  const out = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let worst = 0;
    for (let i = 0; i < a.n; i++) {
      const k = (f * a.n + i) * 2;
      worst = Math.max(worst, Math.hypot(a.positions[k] - b.positions[k], a.positions[k + 1] - b.positions[k + 1]));
    }
    out[f] = worst;
  }
  return out;
}

// ─── Many atoms: clusters, melting, evaporation ──────────────────────────────

/** The first n points of a triangular lattice, nearest the centre first: a close-packed flat cluster. */
export function hexCluster(n: number, spacing: number, cx: number, cy: number): { x: number; y: number }[] {
  const pts: { x: number; y: number; d: number; a: number }[] = [];
  const rings = Math.ceil(Math.sqrt(n)) + 2;
  for (let row = -rings; row <= rings; row++) {
    for (let col = -rings; col <= rings; col++) {
      const px = (col + 0.5 * row) * spacing;
      const py = row * spacing * (Math.sqrt(3) / 2);
      pts.push({ x: px, y: py, d: Math.hypot(px, py), a: Math.atan2(py, px) });
    }
  }
  pts.sort((p, q) => p.d - q.d || p.a - q.a);
  return pts.slice(0, n).map((p) => ({ x: cx + p.x, y: cy + p.y }));
}

/** Random flat-sheet velocities, nm/ps: no net drift, and kinetic energy exactly (n − 1)·k_B·T. */
export function thermalVelocities(n: number, temperatureK: number, massU: number, rand: () => number): { vx: number; vy: number }[] {
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-12))) * Math.cos(2 * Math.PI * rand());
  const v = Array.from({ length: n }, () => ({ vx: gauss(), vy: gauss() }));
  const mx = v.reduce((s, a) => s + a.vx, 0) / n;
  const my = v.reduce((s, a) => s + a.vy, 0) / n;
  for (const a of v) {
    a.vx -= mx;
    a.vy -= my;
  }
  const ke = 0.5 * massU * MASS_UNIT * v.reduce((s, a) => s + a.vx * a.vx + a.vy * a.vy, 0);
  const target = (n - 1) * KB * temperatureK;
  const scale = ke > 0 && target > 0 ? Math.sqrt(target / ke) : 0;
  for (const a of v) {
    a.vx *= scale;
    a.vy *= scale;
  }
  return v;
}

/** Side of the box around an n-atom cluster, nm: room for atoms that break away. */
export const clusterBox = (n: number, sigma: number): number => (n <= 7 ? 10 : n <= 19 ? 13 : n <= 37 ? 16 : 24) * sigma;

/** A close-packed cluster in the middle of its box, every atom given a random starting speed for `temperatureK`. */
export function clusterAtoms(n: number, sigma: number, massU: number, temperatureK: number, seed: number): MdAtom[] {
  const box = clusterBox(n, sigma);
  const sites = hexCluster(n, equilibriumSeparation(sigma), box / 2, box / 2);
  const v = thermalVelocities(n, temperatureK, massU, mulberry32(seed));
  return sites.map((s, i) => ({ ...s, ...v[i] }));
}

/** Temperature of a flat-sheet run, K: its kinetic energy shared over 2n − 2 degrees of freedom. */
export function temperatureSeries(run: MdRun): Float64Array {
  return run.kinetic.map((ke) => ke / (Math.max(1, run.n - 1) * KB));
}

/** Share of the starting neighbour bonds (closer than 1.3σ at t = 0) still shorter than 1.6σ, frame by frame. */
export function bondsIntact(run: MdRun, sigma: number): Float64Array {
  const near = 1.3 * sigma;
  const keep = 1.6 * sigma;
  const bonds: [number, number][] = [];
  for (let i = 0; i < run.n; i++) for (let j = i + 1; j < run.n; j++) if (distanceAt(run, 0, i, j) < near) bonds.push([i, j]);
  const out = new Float64Array(run.nFrames);
  for (let f = 0; f < run.nFrames; f++) {
    let kept = 0;
    for (const [i, j] of bonds) if (distanceAt(run, f, i, j) < keep) kept++;
    out[f] = bonds.length ? kept / bonds.length : 1;
  }
  return out;
}

/** The atoms in the largest group linked by neighbours closer than 1.5σ, as a membership mask. */
export function largestClusterMask(run: MdRun, frame: number, sigma: number): boolean[] {
  const n = run.n;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const link = 1.5 * sigma;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (distanceAt(run, frame, i, j) < link) parent[find(i)] = find(j);
  const sizes = new Map<number, number>();
  for (let i = 0; i < n; i++) sizes.set(find(i), (sizes.get(find(i)) ?? 0) + 1);
  let best = find(0);
  for (const [root, size] of sizes) if (size > (sizes.get(best) ?? 0)) best = root;
  return Array.from({ length: n }, (_, i) => find(i) === best);
}

export type Phase = 'solid' | 'liquid' | 'gas';

/**
 * A plain-language call on the final quarter of a run: gas once the biggest
 * group holds under half the atoms; solid while nine in ten starting bonds
 * survive; liquid in between, where atoms swap neighbours but stay together.
 */
export function classifyPhase(run: MdRun, bonds: ArrayLike<number>, sigma: number): { phase: Phase; bondShare: number; largest: number } {
  const from = Math.floor(run.nFrames * 0.75);
  let sum = 0;
  for (let f = from; f < run.nFrames; f++) sum += bonds[f];
  const bondShare = sum / Math.max(1, run.nFrames - from);
  const largest = largestClusterMask(run, run.nFrames - 1, sigma).filter(Boolean).length;
  const phase: Phase = largest < run.n / 2 ? 'gas' : bondShare >= 0.9 ? 'solid' : 'liquid';
  return { phase, bondShare, largest };
}

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
