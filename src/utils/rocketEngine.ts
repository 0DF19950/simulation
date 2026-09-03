/**
 * Rocket ascent: a projectile whose own mass shrinks while a thrust force
 * acts on it. The falling-body and projectile engines both assume constant
 * mass, so F = ma is enough. A burning rocket breaks that assumption — mass
 * leaves continuously, so the same thrust produces more and more
 * acceleration as the rocket empties out. That is the whole reason Lesson 3
 * exists, so — like the orbital and projectile engines before it — it gets
 * its own integrator.
 *
 * The thrust direction follows a simple *prescribed* pitch program (a
 * kinematic "gravity turn", not a self-correcting guidance system): straight
 * up until turnStartFrac of the burn, then tipping linearly to
 * gravityTurnDeg from vertical by burnout. After burnout the engine cuts out
 * and the rocket becomes exactly a Lesson 2 projectile — thrust drops to
 * zero and only gravity (and optionally drag) act on it.
 */

export type Integrator = 'euler' | 'rk4';

export interface RocketParams {
  m0: number; // initial mass: rocket + fuel (kg)
  mf: number; // dry mass after burnout (kg)
  burnTime: number; // seconds of powered flight
  exhaustVelocity: number; // ve, m/s
  gravity: number; // g, m/s^2
  dragCoefficient: number; // quadratic drag coefficient (already mass-normalized), 0 = off
  gravityTurnDeg: number; // tip angle from vertical reached by burnout; 0 = straight up
  turnStartFrac: number; // fraction of burn time before the turn begins (0..1)
  dt: number;
  method: Integrator;
}

export interface RocketPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  speed: number;
  thrust: number; // N per kg of *current* mass would be acceleration; this is the raw force
}

export interface RocketResult {
  points: RocketPoint[];
  burnoutSpeed: number;
  burnoutAltitude: number;
  apogee: number;
  tsiolkovskyDeltaV: number;
  /** Tsiolkovsky's Δv minus the actual speed gained while burning — what gravity (and drag) cost. */
  gravityLossEstimate: number;
  /**
   * Closed-form burnout speed for a straight-up, drag-free burn:
   * v = ve·ln(m0/mf) − g·burnTime. Defined only when there's nothing to
   * break it — no gravity turn, no drag — so the simulator can check itself
   * against real math, the same way Lesson 2's did.
   */
  exactVerticalBurnoutSpeed: number | null;
}

// Realistic exhaust velocities and mass ratios give burnout speeds of several
// km/s, so low-gravity presets (Mars) can take 2000+ seconds to coast up and
// fall back down. Plain JS arithmetic makes a large step budget cheap even
// though it looks generous next to the falling-body/orbit engines.
const MAX_STEPS = 150000;

type State = [number, number, number, number]; // x, y, vx, vy

export function tsiolkovskyDeltaV(exhaustVelocity: number, m0: number, mf: number): number {
  return exhaustVelocity * Math.log(m0 / mf);
}

/** Straight-up, drag-free burnout speed: Tsiolkovsky's Δv minus what gravity took while burning. */
export function exactVerticalBurnoutSpeed(exhaustVelocity: number, m0: number, mf: number, gravity: number, burnTime: number): number {
  return tsiolkovskyDeltaV(exhaustVelocity, m0, mf) - gravity * burnTime;
}

function burnRateOf(params: RocketParams): number {
  return (params.m0 - params.mf) / params.burnTime;
}

function massAt(t: number, params: RocketParams): number {
  if (t >= params.burnTime) return params.mf;
  return params.m0 - burnRateOf(params) * t;
}

/** Pitch angle from vertical (radians) — the kinematic gravity-turn program. */
function pitchAt(t: number, params: RocketParams): number {
  const { burnTime, turnStartFrac, gravityTurnDeg } = params;
  if (gravityTurnDeg === 0) return 0;
  const turnStartT = turnStartFrac * burnTime;
  const clampedT = Math.min(t, burnTime); // hold the burnout angle through the coast phase
  if (clampedT <= turnStartT) return 0;
  const frac = (clampedT - turnStartT) / Math.max(burnTime - turnStartT, 1e-6);
  return (Math.min(frac, 1) * gravityTurnDeg * Math.PI) / 180;
}

function makeAcceleration(params: RocketParams) {
  const rate = burnRateOf(params);
  return (t: number, vx: number, vy: number): { ax: number; ay: number; thrust: number } => {
    const burning = t < params.burnTime;
    const mass = massAt(t, params);
    const thrust = burning ? params.exhaustVelocity * rate : 0;

    let ax = 0;
    let ay = -params.gravity;

    if (burning) {
      const angle = pitchAt(t, params);
      ax += (thrust / mass) * Math.sin(angle);
      ay += (thrust / mass) * Math.cos(angle);
    }

    if (params.dragCoefficient > 0) {
      const speed = Math.hypot(vx, vy);
      if (speed > 0) {
        ax += -params.dragCoefficient * speed * vx;
        ay += -params.dragCoefficient * speed * vy;
      }
    }

    return { ax, ay, thrust };
  };
}

function derivative(
  s: State,
  t: number,
  accel: (t: number, vx: number, vy: number) => { ax: number; ay: number; thrust: number }
): State {
  const { ax, ay } = accel(t, s[2], s[3]);
  return [s[2], s[3], ax, ay];
}

export function simulateRocket(params: RocketParams): RocketResult {
  const { dt, method } = params;
  const accel = makeAcceleration(params);

  let s: State = [0, 0, 0, 0];
  let t = 0;
  const points: RocketPoint[] = [];
  let burnoutSpeed = 0;
  let burnoutAltitude = 0;
  let apogee = 0;
  let burnoutRecorded = false;
  let step = 0;

  const record = (state: State, time: number) => {
    const { thrust } = accel(time, state[2], state[3]);
    const mass = massAt(time, params);
    const speed = Math.hypot(state[2], state[3]);
    points.push({ t: time, x: state[0], y: Math.max(state[1], 0), vx: state[2], vy: state[3], mass, speed, thrust });
    apogee = Math.max(apogee, state[1]);
    if (!burnoutRecorded && time >= params.burnTime) {
      burnoutSpeed = speed;
      burnoutAltitude = state[1];
      burnoutRecorded = true;
    }
  };

  record(s, t);

  while (step < MAX_STEPS) {
    if (method === 'euler') {
      const d = derivative(s, t, accel);
      s = [s[0] + d[0] * dt, s[1] + d[1] * dt, s[2] + d[2] * dt, s[3] + d[3] * dt];
    } else {
      const k1 = derivative(s, t, accel);
      const s2: State = [s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1], s[2] + 0.5 * dt * k1[2], s[3] + 0.5 * dt * k1[3]];
      const k2 = derivative(s2, t + dt / 2, accel);
      const s3: State = [s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1], s[2] + 0.5 * dt * k2[2], s[3] + 0.5 * dt * k2[3]];
      const k3 = derivative(s3, t + dt / 2, accel);
      const s4: State = [s[0] + dt * k3[0], s[1] + dt * k3[1], s[2] + dt * k3[2], s[3] + dt * k3[3]];
      const k4 = derivative(s4, t + dt, accel);
      s = [0, 1, 2, 3].map(
        (j) => s[j] + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])
      ) as State;
    }
    t += dt;
    step++;

    // Only allow "landing" after burnout — a rocket that hasn't left the pad yet hasn't landed.
    if (t >= params.burnTime && s[1] <= 0) {
      const prev = points[points.length - 1];
      const frac = prev.y / (prev.y - s[1]);
      const landX = prev.x + (s[0] - prev.x) * frac;
      const landVx = prev.vx + (s[2] - prev.vx) * frac;
      const landVy = prev.vy + (s[3] - prev.vy) * frac;
      const landT = prev.t + dt * frac;
      record([landX, 0, landVx, landVy], landT);
      break;
    }
    record(s, t);
  }

  const dv = tsiolkovskyDeltaV(params.exhaustVelocity, params.m0, params.mf);
  const exact =
    params.dragCoefficient === 0 && params.gravityTurnDeg === 0
      ? exactVerticalBurnoutSpeed(params.exhaustVelocity, params.m0, params.mf, params.gravity, params.burnTime)
      : null;

  return {
    points,
    burnoutSpeed,
    burnoutAltitude,
    apogee,
    tsiolkovskyDeltaV: dv,
    gravityLossEstimate: Math.max(dv - burnoutSpeed, 0),
    exactVerticalBurnoutSpeed: exact,
  };
}
