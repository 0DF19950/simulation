/**
 * Two-dimensional orbital mechanics.
 *
 * The falling-body engine in simulationEngine.ts is scalar — height and one
 * velocity component. An orbit needs vectors, because gravity and velocity
 * point in different directions at every instant. That is the whole reason
 * Lesson 2 exists, so it gets its own integrator rather than bending the 1D one.
 */

export const EARTH = {
  mu: 3.986004418e14, // GM, m^3/s^2
  radiusM: 6.371e6,
};

export const MOON = {
  mu: 4.9048e12,
  distanceM: 3.844e8,
  periodS: 27.321661 * 86400,
};

export type Integrator = 'euler' | 'rk4';

export type OrbitOutcome = 'impact' | 'circular' | 'elliptical' | 'escape' | 'straight';

export interface OrbitParams {
  altitudeKm: number;
  /** Initial speed as a multiple of the circular speed at that altitude. */
  speedFactor: number;
  /** 1 = real gravity, 0 = Challenge 4's "switch gravity off". */
  gravityScale: number;
  dtSeconds: number;
  method: Integrator;
  /** 0 disables the Moon; 1 is its real mass. */
  moonMassScale: number;
}

export interface OrbitPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  speed: number;
}

export interface OrbitResult {
  points: OrbitPoint[];
  outcome: OrbitOutcome;
  /** Circular speed at the starting radius under real gravity (m/s). */
  circularSpeed: number;
  initialSpeed: number;
  periapsisKm: number | null;
  apoapsisKm: number | null;
  eccentricity: number | null;
  periodMinutes: number | null;
  maxRadiusM: number;
  impactTimeS: number | null;
  /**
   * Percentage drift in specific orbital energy from start to finish. The true
   * value is conserved, so anything non-zero is the integrator's error rather
   * than physics — which is what makes explicit Euler visibly spiral.
   */
  energyDriftPct: number;
}

const MAX_STEPS = 9000;

type State = [number, number, number, number]; // x, y, vx, vy

/** Moon position on a prescribed circular path — kinematic, not self-consistent. */
function moonPosition(t: number): [number, number] {
  const omega = (2 * Math.PI) / MOON.periodS;
  return [MOON.distanceM * Math.cos(omega * t), MOON.distanceM * Math.sin(omega * t)];
}

function makeAcceleration(mu: number, moonMu: number) {
  return (x: number, y: number, t: number): [number, number] => {
    let ax = 0;
    let ay = 0;

    if (mu > 0) {
      const r = Math.hypot(x, y);
      if (r > 0) {
        const k = -mu / (r * r * r);
        ax += k * x;
        ay += k * y;
      }
    }

    if (moonMu > 0) {
      const [mx, my] = moonPosition(t);
      const dx = x - mx;
      const dy = y - my;
      const d = Math.hypot(dx, dy);
      const dm = Math.hypot(mx, my);
      if (d > 0 && dm > 0) {
        // Direct term (Moon pulls the satellite) plus the indirect term (it also
        // pulls Earth, and this frame is centred on Earth).
        ax += -moonMu * (dx / (d * d * d) + mx / (dm * dm * dm));
        ay += -moonMu * (dy / (d * d * d) + my / (dm * dm * dm));
      }
    }

    return [ax, ay];
  };
}

function derivative(
  s: State,
  t: number,
  accel: (x: number, y: number, t: number) => [number, number]
): State {
  const [ax, ay] = accel(s[0], s[1], t);
  return [s[2], s[3], ax, ay];
}

export function simulateOrbit(params: OrbitParams): OrbitResult {
  const { altitudeKm, speedFactor, gravityScale, dtSeconds, method, moonMassScale } = params;

  const r0 = EARTH.radiusM + altitudeKm * 1000;
  const mu = EARTH.mu * gravityScale;
  const moonMu = MOON.mu * moonMassScale;

  // Referenced to real gravity, so "switch gravity off" still launches the
  // satellite at a sensible speed instead of leaving it stationary.
  const circularSpeed = Math.sqrt(EARTH.mu / r0);
  const v0 = speedFactor * circularSpeed;

  const accel = makeAcceleration(mu, moonMu);

  // Conserved quantities from the initial state classify the orbit up front.
  const energy = (v0 * v0) / 2 - (mu > 0 ? mu / r0 : 0);
  const h = r0 * v0; // position (r0, 0) x velocity (0, v0)

  let eccentricity: number | null = null;
  let semiMajor: number | null = null;
  let periodMinutes: number | null = null;

  if (mu > 0) {
    eccentricity = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (mu * mu)));
    if (energy < 0) {
      semiMajor = -mu / (2 * energy);
      periodMinutes = (2 * Math.PI * Math.sqrt(semiMajor ** 3 / mu)) / 60;
    }
  }

  // Simulate about two revolutions of whatever orbit this turns out to be.
  const referencePeriod = 2 * Math.PI * Math.sqrt(r0 ** 3 / EARTH.mu);
  const duration =
    periodMinutes !== null ? 2.05 * periodMinutes * 60 : 3 * referencePeriod;

  const steps = Math.min(Math.ceil(duration / dtSeconds), MAX_STEPS);
  const dt = dtSeconds;

  let s: State = [r0, 0, 0, v0];
  let t = 0;
  const points: OrbitPoint[] = [];
  let maxRadiusM = r0;
  let impactTimeS: number | null = null;

  for (let i = 0; i <= steps; i++) {
    const r = Math.hypot(s[0], s[1]);
    const speed = Math.hypot(s[2], s[3]);
    points.push({ t, x: s[0], y: s[1], vx: s[2], vy: s[3], r, speed });
    maxRadiusM = Math.max(maxRadiusM, r);

    if (r <= EARTH.radiusM && i > 0) {
      impactTimeS = t;
      break;
    }

    if (method === 'euler') {
      const d = derivative(s, t, accel);
      s = [s[0] + d[0] * dt, s[1] + d[1] * dt, s[2] + d[2] * dt, s[3] + d[3] * dt];
    } else {
      const k1 = derivative(s, t, accel);
      const s2: State = [
        s[0] + 0.5 * dt * k1[0],
        s[1] + 0.5 * dt * k1[1],
        s[2] + 0.5 * dt * k1[2],
        s[3] + 0.5 * dt * k1[3],
      ];
      const k2 = derivative(s2, t + dt / 2, accel);
      const s3: State = [
        s[0] + 0.5 * dt * k2[0],
        s[1] + 0.5 * dt * k2[1],
        s[2] + 0.5 * dt * k2[2],
        s[3] + 0.5 * dt * k2[3],
      ];
      const k3 = derivative(s3, t + dt / 2, accel);
      const s4: State = [
        s[0] + dt * k3[0],
        s[1] + dt * k3[1],
        s[2] + dt * k3[2],
        s[3] + dt * k3[3],
      ];
      const k4 = derivative(s4, t + dt, accel);
      s = [0, 1, 2, 3].map(
        (j) => s[j] + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])
      ) as State;
    }

    t += dt;
  }

  // Specific orbital energy is conserved; measure how far the integrator let it move.
  const specificEnergy = (pt: { speed: number; r: number }) =>
    (pt.speed * pt.speed) / 2 - (mu > 0 ? mu / pt.r : 0);
  const e0 = specificEnergy(points[0]);
  const eN = specificEnergy(points[points.length - 1]);
  const energyDriftPct = e0 !== 0 ? Math.abs((eN - e0) / e0) * 100 : 0;

  let outcome: OrbitOutcome;
  if (mu === 0) outcome = 'straight';
  else if (impactTimeS !== null) outcome = 'impact';
  else if (energy >= 0) outcome = 'escape';
  else if ((eccentricity ?? 1) < 0.02) outcome = 'circular';
  else outcome = 'elliptical';

  const periapsisKm =
    semiMajor !== null && eccentricity !== null
      ? (semiMajor * (1 - eccentricity)) / 1000
      : null;
  const apoapsisKm =
    semiMajor !== null && eccentricity !== null
      ? (semiMajor * (1 + eccentricity)) / 1000
      : null;

  return {
    points,
    outcome,
    circularSpeed,
    initialSpeed: v0,
    periapsisKm,
    apoapsisKm,
    eccentricity,
    periodMinutes,
    maxRadiusM,
    impactTimeS,
    energyDriftPct,
  };
}

/** Largest separation between two trajectories — used to size the Moon's effect. */
export function maxSeparationM(a: OrbitPoint[], b: OrbitPoint[]): number {
  const n = Math.min(a.length, b.length);
  let worst = 0;
  for (let i = 0; i < n; i++) {
    worst = Math.max(worst, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y));
  }
  return worst;
}
