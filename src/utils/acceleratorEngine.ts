/**
 * Charged particles in a uniform magnetic field, stepped forward in time.
 *
 * Lessons 6 and 7 could evaluate their fields directly. A beam can't be: each
 * particle's next position depends on where every other particle is now, so
 * the state has to be advanced step by step. The magnetic push uses the Boris
 * scheme, the standard particle pusher in accelerator and plasma codes. It
 * rotates the velocity without changing its size, exactly as a magnetic field
 * does, so speed only changes through physics added on purpose: space charge,
 * the RF cavity, or radiation.
 */

// The lesson's rounded constants, so the simulator reproduces its worked example.
export const E_CHARGE = 1.6e-19; // C
export const PROTON_MASS = 1.67e-27; // kg
const K_COULOMB = 8.99e9; // N·m²/C²
const EPSILON_0 = 8.854e-12; // F/m
const C_LIGHT = 3e8; // m/s

export type SpeciesId = 'proton' | 'deuteron' | 'antiproton';

export interface Species {
  label: string;
  q: number; // C
  m: number; // kg
}

export const SPECIES: Record<SpeciesId, Species> = {
  proton: { label: 'Proton', q: E_CHARGE, m: PROTON_MASS },
  deuteron: { label: 'Deuteron', q: E_CHARGE, m: 2 * PROTON_MASS },
  antiproton: { label: 'Antiproton', q: -E_CHARGE, m: PROTON_MASS },
};

export type Pusher = 'boris' | 'euler';
export type Arrangement = 'single' | 'pair' | 'bunch';

export interface AcceleratorParams {
  species: SpeciesId;
  B: number; // T, pointing out of the screen
  speed: number; // m/s at injection
  arrangement: Arrangement;
  /**
   * Real particles each simulated dot stands for — a "macro-particle", as real
   * beam codes use. Charge and mass scale together, so q/m and every orbit are
   * unchanged; only the dots' repulsion from one another grows.
   */
  macroWeight: number;
  spaceCharge: boolean;
  /** Peak voltage across the RF gap, V. 0 means no cavity. */
  rfVoltage: number;
  /**
   * Fraction of kinetic energy radiated per lap; 0 is off. A real proton here
   * loses ~10⁻¹⁸ per lap, so any visible setting is an exaggeration, and the
   * run reports by how much.
   */
  radiationLossPerLap: number;
  pusher: Pusher;
  laps: number;
  stepsPerLap: number;
}

/** Width of the RF gap, a thin strip along x = 0. */
export const RF_GAP = 0.004; // m
export const PAIR_OFFSET = 0.003; // m, each dot's offset from the injection point
export const BUNCH_SIGMA = 0.002; // m
export const BUNCH_SIZE = 40;
/** Keeps close encounters finite, as N-body codes do. */
const SOFTENING = 0.0005; // m
const MAX_FRAMES = 1500;

export const gyroradius = (s: Species, v: number, B: number): number => (s.m * v) / (Math.abs(s.q) * B);
export const cyclotronPeriod = (s: Species, B: number): number => (2 * Math.PI * s.m) / (Math.abs(s.q) * B);

/** Real (Larmor) energy-loss rate for circular motion, s⁻¹, with dK/dt = −κK. */
export const larmorRate = (s: Species, B: number): number =>
  (s.q ** 4 * B * B) / (3 * Math.PI * EPSILON_0 * C_LIGHT ** 3 * s.m ** 3);

export interface AcceleratorRun {
  nParticles: number;
  nFrames: number;
  frameDt: number; // s
  /** positions[(frame * nParticles + i) * 2] is x, the next entry y, in metres. */
  positions: Float32Array;
  /** Speed of dot 0 at each frame, m/s. */
  speed0: Float32Array;
  chargeSign: number;
  formulaRadius: number;
  formulaPeriod: number;
  /** Measured from the trajectory alone: mean distance from that lap's own centre. */
  firstLapRadius: number;
  lastLapRadius: number;
  /** Time between successive passes of dot 0 through the injection point, s. */
  lapPeriods: number[];
  initialSpeed: number;
  finalSpeed: number;
  /** RMS distance of the dots from their centroid at each lap boundary (bunch only). */
  bunchRmsByLap: number[] | null;
  /** Distance between the two dots at each lap boundary (pair only). */
  pairSeparationByLap: number[] | null;
  /** How far the pair's separation has turned since injection, degrees, per lap (pair only). */
  pairTurnByLap: number[] | null;
  /** Farthest any dot got from the ring centre, m. */
  maxExtent: number;
  /** The loss rate used ÷ the real Larmor rate; null when radiation is off. */
  radiationBoost: number | null;
  /** Gap crossings at which dot 0 received an RF kick. */
  rfKicks: number;
}

/** Deterministic Gaussian pairs, so the same bunch appears on every run. */
function gaussianSampler(seed: number) {
  let a = seed >>> 0;
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return (): [number, number] => {
    const u = Math.max(uniform(), 1e-12);
    const w = uniform();
    const mag = Math.sqrt(-2 * Math.log(u));
    return [mag * Math.cos(2 * Math.PI * w), mag * Math.sin(2 * Math.PI * w)];
  };
}

function lapRadius(xs: number[], ys: number[]): number {
  if (xs.length === 0) return 0;
  const cx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const cy = ys.reduce((s, v) => s + v, 0) / ys.length;
  let sum = 0;
  for (let k = 0; k < xs.length; k++) sum += Math.hypot(xs[k] - cx, ys[k] - cy);
  return sum / xs.length;
}

export function runAccelerator(p: AcceleratorParams): AcceleratorRun {
  const s = SPECIES[p.species];
  const qm = s.q / s.m;
  const sign = Math.sign(s.q);
  const r0 = gyroradius(s, p.speed, p.B);
  const T0 = cyclotronPeriod(s, p.B);
  const omega = (2 * Math.PI) / T0;
  const dt = T0 / p.stepsPerLap;
  const totalSteps = p.laps * p.stepsPerLap;

  // Positive charges curve clockwise with B out of the screen, negative ones
  // anticlockwise. Inject each at the matching side of the ring, moving +x
  // through the RF gap, so every orbit is centred on the origin.
  const injectY = sign > 0 ? r0 : -r0;
  const offsets: [number, number][] = [];
  if (p.arrangement === 'single') offsets.push([0, 0]);
  else if (p.arrangement === 'pair') offsets.push([0, PAIR_OFFSET], [0, -PAIR_OFFSET]);
  else {
    const gauss = gaussianSampler(7);
    for (let i = 0; i < BUNCH_SIZE; i++) {
      const [gx, gy] = gauss();
      offsets.push([gx * BUNCH_SIGMA, gy * BUNCH_SIGMA]);
    }
  }

  const n = offsets.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const vx = new Float64Array(n).fill(p.speed);
  const vy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = offsets[i][0];
    y[i] = injectY + offsets[i][1];
  }

  const macroCharge = s.q * p.macroWeight;
  const spaceChargeOn = p.spaceCharge && n > 1;
  const kRad = p.radiationLossPerLap > 0 ? -Math.log(1 - p.radiationLossPerLap) / T0 : 0;
  const damp = Math.exp((-kRad * dt) / 2); // dv/dt = −(κ/2)v for dK/dt = −κK
  const ex = new Float64Array(n);
  const ey = new Float64Array(n);

  // Thin-gap RF cavity: an energy kick |q|·V·cos(ωt) at each crossing of x = 0,
  // timed to the cyclotron frequency. Applied as an impulse at the crossing
  // rather than as a field inside a strip a couple of steps wide, so the energy
  // gained doesn't depend on how many steps happen to land inside the gap.
  let rfKicks = 0;
  const rfKick = (i: number, tCross: number) => {
    if (i === 0) rfKicks++;
    const speed = Math.hypot(vx[i], vy[i]);
    if (speed === 0) return;
    const dK = Math.abs(s.q) * p.rfVoltage * Math.cos(omega * tCross) * Math.sign(vx[i]);
    const next = Math.sqrt(Math.max(0, speed * speed + (2 * dK) / s.m));
    vx[i] *= next / speed;
    vy[i] *= next / speed;
  };
  if (p.rfVoltage > 0) for (let i = 0; i < n; i++) rfKick(i, 0);

  const recordEvery = Math.max(1, Math.ceil(totalSteps / MAX_FRAMES));
  const nFrames = Math.floor(totalSteps / recordEvery) + 1;
  const positions = new Float32Array(nFrames * n * 2);
  const speed0 = new Float32Array(nFrames);
  let frame = 0;
  let maxExtent = 0;
  const record = () => {
    for (let i = 0; i < n; i++) {
      positions[(frame * n + i) * 2] = x[i];
      positions[(frame * n + i) * 2 + 1] = y[i];
      maxExtent = Math.max(maxExtent, Math.hypot(x[i], y[i]));
    }
    speed0[frame] = Math.hypot(vx[0], vy[0]);
    frame++;
  };

  const bunchRms = () => {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < n; i++) {
      cx += x[i];
      cy += y[i];
    }
    cx /= n;
    cy /= n;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += (x[i] - cx) ** 2 + (y[i] - cy) ** 2;
    return Math.sqrt(sum / n);
  };
  const bunchRmsByLap = p.arrangement === 'bunch' ? [bunchRms()] : null;
  const pairSeparationByLap = p.arrangement === 'pair' ? [Math.hypot(x[1] - x[0], y[1] - y[0])] : null;
  const pairAngle0 = p.arrangement === 'pair' ? Math.atan2(y[1] - y[0], x[1] - x[0]) : 0;
  let pairTurn = 0;
  let pairAnglePrev = pairAngle0;
  const pairTurnByLap = p.arrangement === 'pair' ? [0] : null;

  const firstLap = { xs: [] as number[], ys: [] as number[] };
  const lastLap = { xs: [] as number[], ys: [] as number[] };
  const crossings: number[] = [0];
  const initialSpeed = p.speed; // before any RF kick

  record();
  for (let step = 0; step < totalSteps; step++) {
    const t = step * dt;

    ex.fill(0);
    ey.fill(0);
    if (spaceChargeOn) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[i] - x[j];
          const dy = y[i] - y[j];
          const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
          const f = (K_COULOMB * macroCharge) / (r2 * Math.sqrt(r2));
          ex[i] += f * dx;
          ey[i] += f * dy;
          ex[j] -= f * dx;
          ey[j] -= f * dy;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const prevX = x[i];
      if (p.pusher === 'boris') {
        const h = (qm * dt) / 2;
        const vxm = vx[i] + h * ex[i];
        const vym = vy[i] + h * ey[i];
        const tz = h * p.B;
        const sz = (2 * tz) / (1 + tz * tz);
        const vpx = vxm + vym * tz;
        const vpy = vym - vxm * tz;
        vx[i] = vxm + vpy * sz + h * ex[i];
        vy[i] = vym - vpx * sz + h * ey[i];
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      } else {
        const ax = qm * (ex[i] + vy[i] * p.B);
        const ay = qm * (ey[i] - vx[i] * p.B);
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        vx[i] += ax * dt;
        vy[i] += ay * dt;
      }

      if (damp !== 1) {
        vx[i] *= damp;
        vy[i] *= damp;
      }

      if ((prevX < 0) !== (x[i] < 0)) {
        const tCross = t + (dt * -prevX) / (x[i] - prevX);
        if (p.rfVoltage > 0) rfKick(i, tCross);
        if (i === 0 && prevX < 0 && vx[0] > 0) crossings.push(tCross);
      }
    }

    if (step < p.stepsPerLap) {
      firstLap.xs.push(x[0]);
      firstLap.ys.push(y[0]);
    }
    if (step >= totalSteps - p.stepsPerLap) {
      lastLap.xs.push(x[0]);
      lastLap.ys.push(y[0]);
    }

    if ((step + 1) % p.stepsPerLap === 0) {
      if (bunchRmsByLap) bunchRmsByLap.push(bunchRms());
      if (pairSeparationByLap && pairTurnByLap) {
        pairSeparationByLap.push(Math.hypot(x[1] - x[0], y[1] - y[0]));
      }
    }
    if (pairTurnByLap) {
      // Unwrap the separation angle every step, so full turns aren't lost.
      const angle = Math.atan2(y[1] - y[0], x[1] - x[0]);
      let delta = angle - pairAnglePrev;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      pairTurn += delta;
      pairAnglePrev = angle;
      if ((step + 1) % p.stepsPerLap === 0) pairTurnByLap.push((pairTurn * 180) / Math.PI);
    }

    if ((step + 1) % recordEvery === 0) record();
  }

  const lapPeriods: number[] = [];
  for (let k = 1; k < crossings.length; k++) lapPeriods.push(crossings[k] - crossings[k - 1]);

  return {
    nParticles: n,
    nFrames: frame,
    frameDt: dt * recordEvery,
    positions,
    speed0,
    chargeSign: sign,
    formulaRadius: r0,
    formulaPeriod: T0,
    firstLapRadius: lapRadius(firstLap.xs, firstLap.ys),
    lastLapRadius: lapRadius(lastLap.xs, lastLap.ys),
    lapPeriods,
    initialSpeed,
    finalSpeed: Math.hypot(vx[0], vy[0]),
    bunchRmsByLap,
    pairSeparationByLap,
    pairTurnByLap,
    maxExtent,
    radiationBoost: kRad > 0 ? kRad / larmorRate(s, p.B) : null,
    rfKicks,
  };
}
