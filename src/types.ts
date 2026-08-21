export type PhysicsDomain = 'classical' | 'waves' | 'modern';

export type AudienceTier = 'highschool' | 'undergrad' | 'researcher';

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
  // Additional parameters for non-falling simulations
  pendulumLength?: number;
  waveSpeed?: number;
  damping?: number;
  quantumBarrierHeight?: number;
  relativityGamma?: number;
}

export interface TrajectoryPoint {
  t: number;
  y: number;
  v: number;
  a: number;
  ek: number;
  ep: number;
  etotal: number;
  // Generic secondary coordinate for other simulations (e.g., angle theta, wave height, x position)
  x?: number;
  vx?: number;
  theta?: number;
  omega?: number;
}

export interface PhysicsModule {
  id: string;
  title: string;
  domain: PhysicsDomain;
  tier: AudienceTier;
  shortDesc: string;
  fullDesc: string;
  mathLaTeX: string[];
  whySimulateReason: string;
  defaultParams: SimulationParams;
  defaultPythonCode: string;
  exercisePrompt: string;
}

export interface CourseTierInfo {
  tier: AudienceTier;
  label: string;
  tagline: string;
  prerequisites: string;
  mathFocus: string;
  programmingDepth: string;
  sampleCode: string;
}
