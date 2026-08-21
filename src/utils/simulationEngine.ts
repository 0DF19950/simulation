import { SimulationParams, TrajectoryPoint } from '../types';

export function runNumericalSimulation(params: SimulationParams, customAccelerationFn?: (y: number, v: number) => number): TrajectoryPoint[] {
  const { gravity, initialHeight, initialVelocity, dragCoefficient, mass, dt, method } = params;

  const points: TrajectoryPoint[] = [];
  let t = 0.0;
  let y = initialHeight;
  let v = initialVelocity;

  const defaultAcceleration = (yVal: number, vVal: number) => {
    // Standard quadratic air drag: F_drag = -b * v * |v|
    const dragForce = -dragCoefficient * vVal * Math.abs(vVal);
    const gravityForce = -mass * gravity;
    return (gravityForce + dragForce) / mass;
  };

  const getAccel = customAccelerationFn || defaultAcceleration;

  const maxSteps = 4000;
  let step = 0;

  while (y > -0.01 && step < maxSteps) {
    const a = getAccel(y, v);

    // Compute mechanical energy
    const ek = 0.5 * mass * v * v;
    const ep = mass * gravity * Math.max(y, 0);
    const etotal = ek + ep;

    points.push({
      t: Number(t.toFixed(4)),
      y: Number(Math.max(y, 0).toFixed(4)),
      v: Number(v.toFixed(4)),
      a: Number(a.toFixed(4)),
      ek: Number(ek.toFixed(2)),
      ep: Number(ep.toFixed(2)),
      etotal: Number(etotal.toFixed(2)),
    });

    if (y <= 0 && step > 0) break;

    // Step Forward according to selected numerical integration scheme
    if (method === 'euler') {
      v += a * dt;
      y += (v - a * dt) * dt; // y_next = y + v_old * dt
    } else if (method === 'eulercromer') {
      v += a * dt;
      y += v * dt; // y_next = y + v_new * dt
    } else {
      // Runge-Kutta 4th Order (RK4)
      const k1_v = getAccel(y, v);
      const k1_y = v;

      const k2_v = getAccel(y + 0.5 * dt * k1_y, v + 0.5 * dt * k1_v);
      const k2_y = v + 0.5 * dt * k1_v;

      const k3_v = getAccel(y + 0.5 * dt * k2_y, v + 0.5 * dt * k2_v);
      const k3_y = v + 0.5 * dt * k2_v;

      const k4_v = getAccel(y + dt * k3_y, v + dt * k3_v);
      const k4_y = v + dt * k3_v;

      v += (dt / 6.0) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);
      y += (dt / 6.0) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y);
    }

    t += dt;
    step++;
  }

  return points;
}

export function exportTrajectoryToCSV(points: TrajectoryPoint[], filename = 'philomathlab_trajectory.csv') {
  if (!points || points.length === 0) return;

  const headers = ['Time(s)', 'Height(m)', 'Velocity(m/s)', 'Acceleration(m/s^2)', 'KineticEnergy(J)', 'PotentialEnergy(J)', 'TotalEnergy(J)'];
  const rows = points.map((p) => [p.t, p.y, p.v, p.a, p.ek, p.ep, p.etotal].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
