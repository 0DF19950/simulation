/**
 * Two-dimensional projectile motion.
 *
 * The falling-body engine in simulationEngine.ts is scalar — height and one
 * velocity component. A launched object needs vectors, because its velocity
 * has a horizontal part that never changes (no drag) and a vertical part
 * gravity constantly bends. That split is the whole reason Lesson 2 exists,
 * so — like the orbital engine — it gets its own integrator rather than
 * bending the 1D one.
 */

export type Integrator = 'euler' | 'rk4';

export interface ProjectileParams {
  speed: number; // v0, launch speed, m/s
  angleDeg: number; // launch angle above the ground, degrees
  gravity: number; // g, m/s^2
  dragCoefficient: number; // quadratic drag coefficient (already mass-normalized), 0 = off
  windSpeed: number; // steady horizontal wind, m/s — only matters once drag is on
  dt: number;
  method: Integrator;
}

export interface ProjectilePoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  speed: number;
  ek: number;
  ep: number;
  etotal: number;
}

export interface ProjectileResult {
  points: ProjectilePoint[];
  range: number;
  maxHeight: number;
  timeOfFlight: number;
  /** Closed-form values from Part 3 — only defined when there is no drag to break them. */
  analytic: { range: number; maxHeight: number; timeOfFlight: number } | null;
  /**
   * Percentage drift in specific mechanical energy from start to finish.
   * Meaningful only when drag is off — with drag, energy is *supposed* to
   * fall, so this is the integrator's own error, not real physics.
   */
  energyDriftPct: number;
}

const MAX_STEPS = 20000;

type State = [number, number, number, number]; // x, y, vx, vy

export function splitLaunchVelocity(speed: number, angleDeg: number): { v0x: number; v0y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { v0x: speed * Math.cos(rad), v0y: speed * Math.sin(rad) };
}

/** Closed-form range/height/time for a drag-free launch from ground level (Part 3). */
export function analyticProjectile(speed: number, angleDeg: number, gravity: number) {
  const { v0x, v0y } = splitLaunchVelocity(speed, angleDeg);
  const timeOfFlight = (2 * v0y) / gravity;
  return {
    range: v0x * timeOfFlight,
    maxHeight: (v0y * v0y) / (2 * gravity),
    timeOfFlight,
  };
}

function makeAcceleration(gravity: number, dragCoefficient: number, windSpeed: number) {
  return (vx: number, vy: number): [number, number] => {
    if (dragCoefficient === 0) return [0, -gravity];

    // Drag opposes velocity *relative to the air*, not relative to the ground.
    const relVx = vx - windSpeed;
    const relVy = vy;
    const relSpeed = Math.hypot(relVx, relVy);
    if (relSpeed === 0) return [0, -gravity];

    return [-dragCoefficient * relSpeed * relVx, -gravity - dragCoefficient * relSpeed * relVy];
  };
}

function derivative(
  s: State,
  accel: (vx: number, vy: number) => [number, number]
): State {
  const [ax, ay] = accel(s[2], s[3]);
  return [s[2], s[3], ax, ay];
}

export function simulateProjectile(params: ProjectileParams): ProjectileResult {
  const { speed, angleDeg, gravity, dragCoefficient, windSpeed, dt, method } = params;
  const { v0x, v0y } = splitLaunchVelocity(speed, angleDeg);
  const accel = makeAcceleration(gravity, dragCoefficient, windSpeed);

  let s: State = [0, 0, v0x, v0y];
  let t = 0;
  const points: ProjectilePoint[] = [];
  let maxHeight = 0;
  let step = 0;

  const record = (state: State, time: number) => {
    const [ax, ay] = accel(state[2], state[3]);
    const sp = Math.hypot(state[2], state[3]);
    const ek = 0.5 * sp * sp;
    const ep = gravity * Math.max(state[1], 0);
    points.push({
      t: time,
      x: state[0],
      y: Math.max(state[1], 0),
      vx: state[2],
      vy: state[3],
      ax,
      ay,
      speed: sp,
      ek,
      ep,
      etotal: ek + ep,
    });
    maxHeight = Math.max(maxHeight, state[1]);
  };

  record(s, t);

  while (step < MAX_STEPS) {
    if (method === 'euler') {
      const d = derivative(s, accel);
      s = [s[0] + d[0] * dt, s[1] + d[1] * dt, s[2] + d[2] * dt, s[3] + d[3] * dt];
    } else {
      const k1 = derivative(s, accel);
      const s2: State = [s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1], s[2] + 0.5 * dt * k1[2], s[3] + 0.5 * dt * k1[3]];
      const k2 = derivative(s2, accel);
      const s3: State = [s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1], s[2] + 0.5 * dt * k2[2], s[3] + 0.5 * dt * k2[3]];
      const k3 = derivative(s3, accel);
      const s4: State = [s[0] + dt * k3[0], s[1] + dt * k3[1], s[2] + dt * k3[2], s[3] + dt * k3[3]];
      const k4 = derivative(s4, accel);
      s = [0, 1, 2, 3].map(
        (j) => s[j] + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])
      ) as State;
    }
    t += dt;
    step++;

    if (s[1] <= 0) {
      // Linearly interpolate the whole landing state so range/time/velocity don't
      // jump by a full dt-sized step — otherwise the "energy at landing" reading
      // picks up spurious drift from the overshoot itself, not from the integrator.
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

  const last = points[points.length - 1];
  const analytic = dragCoefficient === 0 ? analyticProjectile(speed, angleDeg, gravity) : null;

  const e0 = points[0].etotal;
  const eN = last.etotal;
  const energyDriftPct = e0 !== 0 ? Math.abs((eN - e0) / e0) * 100 : 0;

  return {
    points,
    range: last.x,
    maxHeight,
    timeOfFlight: last.t,
    analytic,
    energyDriftPct,
  };
}
