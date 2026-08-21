export type AudienceTier = 'highschool' | 'undergrad' | 'researcher';

// Kept for compatibility with PygameCanvasVisualizer / PythonLabEditor props,
// which were originally shared across multiple physics domains.
// This single-page build only ever uses 'classical'.
export type PhysicsDomain = 'classical' | 'waves' | 'modern';

export interface CelestialBody {
  id: string;
  name: string;
  g: number; // m/s^2
  description: string;
  atmosphereDensity: number; // kg/m^3
  color: string;
  radiusKm: number;
  icon: string;
}

export interface SimulationParams {
  gravity: number;
  initialHeight: number;
  initialVelocity: number;
  dragCoefficient: number;
  mass: number;
  dt: number;
  method: 'euler' | 'eulercromer' | 'rk4';
}

export interface TrajectoryPoint {
  t: number;
  y: number;
  v: number;
  a: number;
  ek: number;
  ep: number;
  etotal: number;
}
