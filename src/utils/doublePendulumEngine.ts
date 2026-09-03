/**
 * The double pendulum: two point masses on massless rods, the second
 * hanging from the end of the first. Every engine before this one modeled a
 * system that has some exact formula in a simplified case — a height, a
 * range, a Δv, a circular orbital speed. This one doesn't. The equations of
 * motion are exact and deterministic, but nonlinear and coupled: neither
 * angle can be solved for on its own, and there is no known way to write
 * θ1(t) or θ2(t) as closed-form functions of time for the general case.
 * Simulation isn't a convenience here — it's the only way to find out what
 * one specific set of starting conditions actually does.
 *
 * Angles are measured from the downward vertical. Standard point-mass,
 * massless-rod formulation (see e.g. the classic Lagrangian derivation) —
 * this exact pair of equations is what f1/f2 in the lesson stand for.
 */

export type Integrator = 'euler' | 'rk4';

export interface DoublePendulumParams {
  l1: number; // upper arm length, m
  l2: number; // lower arm length, m
  m1: number; // upper bob mass, kg
  m2: number; // lower bob mass, kg
  gravity: number;
  theta1: number; // initial angle of upper arm, radians (from vertical)
  theta2: number; // initial angle of lower arm, radians
  omega1: number; // initial angular velocity, rad/s
  omega2: number;
  dt: number;
  method: Integrator;
  durationS: number;
}

export interface DoublePendulumPoint {
  t: number;
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  energy: number;
}

export interface DoublePendulumResult {
  points: DoublePendulumPoint[];
  energyDriftPct: number;
}

type State = [number, number, number, number]; // theta1, theta2, omega1, omega2

export function bobPositions(l1: number, l2: number, theta1: number, theta2: number) {
  const x1 = l1 * Math.sin(theta1);
  const y1 = -l1 * Math.cos(theta1);
  const x2 = x1 + l2 * Math.sin(theta2);
  const y2 = y1 - l2 * Math.cos(theta2);
  return { x1, y1, x2, y2 };
}

/** Kinetic + potential energy per the standard double-pendulum Lagrangian, taking the pivot as the zero of height. */
function mechanicalEnergy(params: DoublePendulumParams, s: State): number {
  const { l1, l2, m1, m2, gravity } = params;
  const [theta1, theta2, omega1, omega2] = s;
  const ke =
    0.5 * m1 * l1 * l1 * omega1 * omega1 +
    0.5 *
      m2 *
      (l1 * l1 * omega1 * omega1 +
        l2 * l2 * omega2 * omega2 +
        2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2));
  const pe = -gravity * ((m1 + m2) * l1 * Math.cos(theta1) + m2 * l2 * Math.cos(theta2));
  return ke + pe;
}

function derivative(s: State, params: DoublePendulumParams): State {
  const { l1, l2, m1, m2, gravity: g } = params;
  const [theta1, theta2, omega1, omega2] = s;
  const delta = theta1 - theta2;
  const denom = 2 * m1 + m2 - m2 * Math.cos(2 * delta);

  const num1 =
    -g * (2 * m1 + m2) * Math.sin(theta1) -
    m2 * g * Math.sin(theta1 - 2 * theta2) -
    2 * Math.sin(delta) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta));
  const alpha1 = num1 / (l1 * denom);

  const num2 =
    2 *
    Math.sin(delta) *
    (omega1 * omega1 * l1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(theta1) +
      omega2 * omega2 * l2 * m2 * Math.cos(delta));
  const alpha2 = num2 / (l2 * denom);

  return [omega1, omega2, alpha1, alpha2];
}

export function simulateDoublePendulum(params: DoublePendulumParams): DoublePendulumResult {
  const { dt, method, durationS, l1, l2 } = params;
  let s: State = [params.theta1, params.theta2, params.omega1, params.omega2];
  let t = 0;
  const points: DoublePendulumPoint[] = [];
  const steps = Math.ceil(durationS / dt);

  const record = (state: State, time: number) => {
    const { x1, y1, x2, y2 } = bobPositions(l1, l2, state[0], state[1]);
    points.push({
      t: time,
      theta1: state[0],
      theta2: state[1],
      omega1: state[2],
      omega2: state[3],
      x1,
      y1,
      x2,
      y2,
      energy: mechanicalEnergy(params, state),
    });
  };

  record(s, t);

  for (let i = 0; i < steps; i++) {
    if (method === 'euler') {
      const d = derivative(s, params);
      s = [s[0] + d[0] * dt, s[1] + d[1] * dt, s[2] + d[2] * dt, s[3] + d[3] * dt];
    } else {
      const k1 = derivative(s, params);
      const s2: State = [s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1], s[2] + 0.5 * dt * k1[2], s[3] + 0.5 * dt * k1[3]];
      const k2 = derivative(s2, params);
      const s3: State = [s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1], s[2] + 0.5 * dt * k2[2], s[3] + 0.5 * dt * k2[3]];
      const k3 = derivative(s3, params);
      const s4: State = [s[0] + dt * k3[0], s[1] + dt * k3[1], s[2] + dt * k3[2], s[3] + dt * k3[3]];
      const k4 = derivative(s4, params);
      s = [0, 1, 2, 3].map(
        (j) => s[j] + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])
      ) as State;
    }
    t += dt;
    record(s, t);
  }

  const e0 = points[0].energy;
  const eN = points[points.length - 1].energy;
  const energyDriftPct = e0 !== 0 ? Math.abs((eN - e0) / e0) * 100 : 0;

  return { points, energyDriftPct };
}

/** Euclidean distance between the two pendulums' lower-bob positions at every matching time step — the divergence trace for the sensitivity demo. */
export function divergenceSeries(a: DoublePendulumPoint[], b: DoublePendulumPoint[]): number[] {
  const n = Math.min(a.length, b.length);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.hypot(a[i].x2 - b[i].x2, a[i].y2 - b[i].y2);
  }
  return out;
}
