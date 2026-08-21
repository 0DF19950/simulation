import { CelestialBody, CourseTierInfo, PhysicsModule } from '../types';

export const CELESTIAL_BODIES: CelestialBody[] = [
  {
    id: 'earth',
    name: 'Earth',
    g: 9.81,
    description: 'Standard terrestrial gravity at sea level.',
    atmosphereDensity: 1.225,
    color: '#3B82F6',
    radiusKm: 6371,
    icon: '🌍'
  },
  {
    id: 'moon',
    name: 'Moon',
    g: 1.62,
    description: 'One-sixth of Earth gravity. No atmospheric drag.',
    atmosphereDensity: 0.0,
    color: '#9CA3AF',
    radiusKm: 1737,
    icon: '🌕'
  },
  {
    id: 'mars',
    name: 'Mars',
    g: 3.71,
    description: 'Red planet gravity with thin CO2 atmosphere.',
    atmosphereDensity: 0.02,
    color: '#EF4444',
    radiusKm: 3389,
    icon: '🔴'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    g: 24.79,
    description: 'Gas giant with immense surface gravity.',
    atmosphereDensity: 1.33,
    color: '#D97706',
    radiusKm: 69911,
    icon: '🪐'
  },
  {
    id: 'europa',
    name: 'Europa',
    g: 1.31,
    description: 'Jovian icy moon with ocean beneath crust.',
    atmosphereDensity: 0.0,
    color: '#60A5FA',
    radiusKm: 1560,
    icon: '🧊'
  },
  {
    id: 'neutron_star',
    name: 'Neutron Star',
    g: 100.0, // Scaled for visual demonstration
    description: 'Extreme gravity regime (scaled 100 m/s² for real-time visualization).',
    atmosphereDensity: 0.0,
    color: '#A855F7',
    radiusKm: 12,
    icon: '⚡'
  }
];

export const COURSE_TIERS: CourseTierInfo[] = [
  {
    tier: 'highschool',
    label: 'High School',
    tagline: 'Build physical intuition from zero algebra barriers',
    prerequisites: 'Basic arithmetic, geometry, and curiosity about how things move',
    mathFocus: 'Kinematic equations, rates of change, $v = v_0 - gt$, $y = y_0 + v_0 t - \\frac{1}{2}gt^2$',
    programmingDepth: 'Simple Python loops, variables, and updating variables step-by-step',
    sampleCode: `# High School Level: Stepping time forward
g = 9.81        # Gravity (m/s^2)
y = 50.0        # Height (meters)
v = 0.0         # Initial velocity (m/s)
dt = 0.02       # Time step (seconds)

def step(y, v):
    a = -g
    v = v + a * dt
    y = y + v * dt
    return y, v`
  },
  {
    tier: 'undergrad',
    label: 'Undergraduate',
    tagline: 'Ordinary differential equations, drag force, & error scaling',
    prerequisites: 'Calculus I & II, Introductory Mechanics, Python basics',
    mathFocus: 'ODEs $\\frac{dv}{dt} = -g - \\frac{b}{m}v|v|$, Euler vs. Runge-Kutta 4th Order (RK4), Phase Space $(y, v)$',
    programmingDepth: 'Functions, numerical integration routines, local error analysis $\\mathcal{O}(\\Delta t^4)$',
    sampleCode: `# Undergraduate Level: Quadratic drag & RK4 integrator
def acceleration(y, v, g=9.81, b=0.05, m=1.0):
    return -g - (b / m) * v * abs(v)

def rk4_step(y, v, dt):
    k1_v = acceleration(y, v)
    k1_y = v
    
    k2_v = acceleration(y + 0.5*dt*k1_y, v + 0.5*dt*k1_v)
    k2_y = v + 0.5*dt*k1_v
    
    k3_v = acceleration(y + 0.5*dt*k2_y, v + 0.5*dt*k2_v)
    k3_y = v + 0.5*dt*k2_v
    
    k4_v = acceleration(y + dt*k3_y, v + dt*k3_v)
    k4_y = v + dt*k3_v
    
    v_next = v + (dt/6.0) * (k1_v + 2*k2_v + 2*k3_v + k4_v)
    y_next = y + (dt/6.0) * (k1_y + 2*k2_y + 2*k3_y + k4_y)
    return y_next, v_next`
  },
  {
    tier: 'researcher',
    label: 'Researcher',
    tagline: 'Stochastic forces, adaptive step size, & phase-space dynamics',
    prerequisites: 'Differential Equations, Classical Mechanics, Python NumPy/SciPy',
    mathFocus: 'Stochastic Differential Equations (SDEs), Langevin dynamics $m d^2y/dt^2 = -m g - b v|v| + \\xi(t)$, Energy Drift',
    programmingDepth: 'Vectorized NumPy arrays, adaptive step sizing, Monte Carlo error bounds, Pygame visual overlays',
    sampleCode: `# Researcher Level: Stochastic drag + altitude-dependent g
import numpy as np

def compute_force(y, v, params):
    G, M, R_e = 6.674e-11, 5.972e24, 6.371e6
    g_y = G * M / ((R_e + max(y, 0))**2)
    
    # Quadratic drag with atmospheric scale height
    rho_0, H_scale = 1.225, 8500.0
    rho = rho_0 * np.exp(-max(y, 0) / H_scale)
    f_drag = 0.5 * rho * params['Cd'] * params['Area'] * v * abs(v)
    
    # Stochastic wind noise process
    xi = np.random.normal(0, params['noise_sigma'])
    return -g_y - (f_drag / params['mass']) + xi`
  }
];

export const PHYSICS_MODULES: PhysicsModule[] = [
  // 🟢 TIER 1 — CLASSICAL PHYSICS
  {
    id: 'projectile_2d',
    title: '1. Projectile & 2D Motion',
    domain: 'classical',
    tier: 'highschool',
    shortDesc: 'Parabolic trajectories, velocity vector decomposition, quadratic drag force, and max range optimization.',
    fullDesc: 'Model 2D projectile trajectories under uniform gravity and quadratic air resistance. Decompose velocity into x and y components to see how drag couples orthogonal axes.',
    mathLaTeX: [
      'a_x = -\\frac{b}{m} v_x |v|',
      'a_y = -g - \\frac{b}{m} v_y |v|',
      'x(t) = \\int v_x dt, \\quad y(t) = \\int v_y dt'
    ],
    whySimulateReason: 'Air drag couples horizontal and vertical motion, eliminating simple closed-form algebraic solutions for trajectory range.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 0.0,
      initialVelocity: 25.0,
      dragCoefficient: 0.05,
      mass: 1.0,
      dt: 0.02,
      method: 'euler'
    },
    defaultPythonCode: `# Classical Physics: Projectile & 2D Motion
def acceleration(y, v):
    g = 9.81       # Gravity (m/s^2)
    drag = 0.05    # Air drag coefficient
    return -g - drag * v * abs(v)`,
    exercisePrompt: 'Vary initial launch angle and drag coefficient to find the optimal angle for maximum range under atmospheric drag.'
  },
  {
    id: 'collisions_conservation',
    title: '2. Collisions & Conservation Laws',
    domain: 'classical',
    tier: 'highschool',
    shortDesc: 'Elastic and inelastic collisions, linear momentum conservation, and mechanical energy restitution.',
    fullDesc: 'Simulate two-body impacts with coefficient of restitution e. Trace kinetic energy loss during inelastic deformation and momentum conservation.',
    mathLaTeX: [
      'm_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}',
      'e = \\frac{v_{2f} - v_{1f}}{v_{1i} - v_{2i}}',
      '\\Delta E_k = \\frac{1}{2}m_1 v_{1i}^2 + \\frac{1}{2}m_2 v_{2i}^2 - E_{kf}'
    ],
    whySimulateReason: 'Simulating instantaneous contact forces and momentum transfer during sequential multi-body impact sequences.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 10.0,
      initialVelocity: 15.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'euler'
    },
    defaultPythonCode: `# Classical Physics: Collisions & Restitution
def collision_step(m1, v1, m2, v2, e=0.9):
    v1_final = ((m1 - e*m2)*v1 + (1 + e)*m2*v2) / (m1 + m2)
    v2_final = ((1 + e)*m1*v1 + (m2 - e*m1)*v2) / (m1 + m2)
    return v1_final, v2_final`,
    exercisePrompt: 'Set e = 1.0 for perfect elastic collision, then reduce e = 0.0 for completely sticky inelastic merging.'
  },
  {
    id: 'oscillations_coupled',
    title: '3. Oscillations & Coupled Oscillators',
    domain: 'classical',
    tier: 'undergrad',
    shortDesc: 'Simple harmonic motion, damping, resonance, normal modes, and energy exchange in coupled springs.',
    fullDesc: 'Explore natural frequencies and normal modes in mass-spring chains subjected to periodic external forcing.',
    mathLaTeX: [
      'm \\ddot{x} + b \\dot{x} + k x = F_0 \\cos(\\omega t)',
      '\\omega_0 = \\sqrt{\\frac{k}{m}}',
      '\\begin{pmatrix} \\ddot{x}_1 \\\\ \\ddot{x}_2 \\end{pmatrix} = -\\mathbf{M}^{-1} \\mathbf{K} \\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix}'
    ],
    whySimulateReason: 'Coupled spring systems exhibit beats and rapid energy exchange between normal modes that are best visualized dynamically.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 20.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.1,
      mass: 1.0,
      dt: 0.02,
      method: 'rk4'
    },
    defaultPythonCode: `# Classical Physics: Damped Driven Oscillator
def acceleration(x, v, t=0):
    k = 10.0      # Spring constant
    b = 0.2       # Damping coefficient
    m = 1.0       # Mass
    return (-k*x - b*v) / m`,
    exercisePrompt: 'Tune the driving frequency w to match the natural frequency w0 = sqrt(k/m) to trigger resonance amplitude blowout.'
  },
  {
    id: 'orbital_three_body',
    title: '4. Orbital Dynamics & Three-Body Problem',
    domain: 'classical',
    tier: 'researcher',
    shortDesc: 'Keplerian planetary orbits, gravitational N-body simulations, Lagrange points, and orbital chaos.',
    fullDesc: 'Simulate gravitational interaction between three bodies governed by Newton law of universal gravitation.',
    mathLaTeX: [
      '\\mathbf{F}_i = G m_i \\sum_{j \\neq i} \\frac{m_j (\\mathbf{r}_j - \\mathbf{r}_i)}{|\\mathbf{r}_j - \\mathbf{r}_i|^3}',
      'E_{tot} = \\sum \\frac{1}{2} m_i v_i^2 - \\sum_{i<j} \\frac{G m_i m_j}{r_{ij}}'
    ],
    whySimulateReason: 'The gravitational three-body problem is non-integrable in general and exhibits deterministic chaos requiring numerical integrators.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 50.0,
      initialVelocity: 7.8,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Classical Physics: Gravitational Orbital Acceleration
def acceleration(y, v):
    G, M = 6.674e-11, 5.972e24
    r = max(y, 1.0)
    return -G * M / (r**2)`,
    exercisePrompt: 'Slightly alter initial orbital velocity by 0.1% and watch how the long-term chaotic trajectory diverges.'
  },
  {
    id: 'rigid_body_dynamics',
    title: '5. Rigid Body Dynamics',
    domain: 'classical',
    tier: 'undergrad',
    shortDesc: 'Moment of inertia, rotational kinematics, torque, precession, and gyroscopic stability.',
    fullDesc: 'Model rotation of rigid bodies around principal axes using Euler equations of rotational dynamics.',
    mathLaTeX: [
      '\\tau = I \\alpha',
      'L = I \\omega',
      'I_1 \\dot{\\omega}_1 + (I_3 - I_2)\\omega_2 \\omega_3 = 0'
    ],
    whySimulateReason: 'Torque-free rotation around the intermediate principal axis causes unstable flipping (Dzhanibekov effect).',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 30.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.05,
      mass: 2.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Classical Physics: Rigid Body Torque & Precession
def acceleration(theta, omega):
    I = 0.5 * 2.0 * (0.3**2)  # Moment of inertia
    torque = -0.1 * omega      # Rotational drag
    return torque / I`,
    exercisePrompt: 'Simulate rotational damping and observe how angular momentum vectors precess under external torque.'
  },

  // 🔵 TIER 2 — WAVES & FIELDS
  {
    id: 'wave_propagation',
    title: '1. Wave Propagation',
    domain: 'waves',
    tier: 'highschool',
    shortDesc: '1D wave speed, dispersion, boundary reflection (fixed vs free ends), and wave pulse superposition.',
    fullDesc: 'Simulate mechanical wave pulses traveling along a stretched string using finite-difference time domain.',
    mathLaTeX: [
      'v = f \\lambda',
      '\\frac{\\partial^2 u}{\\partial t^2} = v^2 \\frac{\\partial^2 u}{\\partial x^2}',
      'u(x,t) = f(x - vt) + g(x + vt)'
    ],
    whySimulateReason: 'Simulating wave reflection and phase inversion at fixed/free boundaries in real-time.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 20.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.01,
      mass: 1.0,
      dt: 0.01,
      method: 'eulercromer'
    },
    defaultPythonCode: `# Waves & Fields: Wave Propagation Forcing
def wave_forcing(x, t):
    frequency = 1.5
    damping = 0.02
    return sin(2 * 3.14159 * frequency * t) * exp(-damping * t)`,
    exercisePrompt: 'Observe how a traveling wave pulse flips upside down when reflecting off a fixed rigid boundary.'
  },
  {
    id: 'interference_diffraction',
    title: '2. Interference & Diffraction',
    domain: 'waves',
    tier: 'undergrad',
    shortDesc: 'Young double-slit experiment, Fresnel/Fraunhofer diffraction, and optical phase superposition.',
    fullDesc: 'Calculate wave intensity patterns resulting from multi-slit aperture diffraction and spatial interference.',
    mathLaTeX: [
      'd \\sin\\theta = m \\lambda',
      'I(\\theta) = I_0 \\cos^2\\left(\\frac{\\pi d \\sin\\theta}{\\lambda}\\right) \\left(\\frac{\\sin(\\beta)}{\\beta}\\right)^2',
      '\\Delta \\phi = \\frac{2\\pi}{\\lambda} \\Delta L'
    ],
    whySimulateReason: 'Integrating continuous aperture field contributions across near-field diffraction geometry.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 10.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'euler'
    },
    defaultPythonCode: `# Waves & Fields: Double Slit Intensity Profile
def double_slit_intensity(theta, wavelength=500e-9, d=1e-4, a=2e-5):
    beta = (3.14159 * a * sin(theta)) / wavelength
    alpha = (3.14159 * d * sin(theta)) / wavelength
    diffraction = (sin(beta) / beta)**2 if beta != 0 else 1.0
    interference = cos(alpha)**2
    return diffraction * interference`,
    exercisePrompt: 'Narrow the slit width a and watch the central diffraction envelope widen across the detector plane.'
  },
  {
    id: 'electrostatic_fields',
    title: '3. Electrostatic Fields',
    domain: 'waves',
    tier: 'highschool',
    shortDesc: 'Coulomb Law, electric field lines, scalar potential, and charged particle deflection.',
    fullDesc: 'Compute net electrostatic force vectors and electric field lines created by multiple point charges.',
    mathLaTeX: [
      '\\mathbf{F} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2} \\hat{\mathbf{r}}',
      'V(\\mathbf{r}) = \\sum \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_i}{|\\mathbf{r} - \\mathbf{r}_i|}'
    ],
    whySimulateReason: 'Visualizing complex 2D vector field lines and equipotential surfaces for arbitrary multi-charge arrays.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 25.0,
      initialVelocity: 10.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'euler'
    },
    defaultPythonCode: `# Waves & Fields: Charged Particle in Coulomb Field
def acceleration(y, v):
    q, Q_source, k_e = 1.0, -5.0, 8.99e1
    r = max(abs(y), 0.1)
    return (k_e * q * Q_source) / (r**2)`,
    exercisePrompt: 'Place two like charges close together and trace the electrostatic potential barrier between them.'
  },
  {
    id: 'electromagnetic_waves',
    title: '4. Electromagnetic Waves',
    domain: 'waves',
    tier: 'undergrad',
    shortDesc: 'Maxwell equations, Poynting vector, E/B vector field propagation, and wave polarization.',
    fullDesc: 'Simulate coupled E and B vector fields propagating through vacuum and dielectric media.',
    mathLaTeX: [
      '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}',
      '\\nabla \\times \\mathbf{B} = \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}',
      '\\mathbf{S} = \\frac{1}{\\mu_0} (\\mathbf{E} \\times \\mathbf{B})'
    ],
    whySimulateReason: 'Coupled E and B transverse wave propagation and impedance matching across dielectric boundaries.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 15.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Waves & Fields: EM Wave Transverse Field
def acceleration(y, v):
    w = 2.0 * 3.14159 * 1.0
    c = 3.0
    return -(w**2) * y`,
    exercisePrompt: 'Simulate EM wave pulse passing from vacuum into glass (n = 1.5) and observe wave speed reduction.'
  },
  {
    id: 'fluid_dynamics',
    title: '5. Fluid Dynamics',
    domain: 'waves',
    tier: 'researcher',
    shortDesc: 'Navier-Stokes equations, viscous drag, Bernoulli pressure fields, and vortex shedding.',
    fullDesc: 'Model 2D incompressible viscous fluid flow, pressure Poisson equations, and Reynolds number transitions.',
    mathLaTeX: [
      '\\rho \\left(\\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u} \\cdot \\nabla \\mathbf{u}\\right) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}',
      '\\nabla \\cdot \\mathbf{u} = 0'
    ],
    whySimulateReason: 'Navier-Stokes non-linear advection and vorticity require high-performance grid numerical solvers.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 40.0,
      initialVelocity: 2.0,
      dragCoefficient: 0.2,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Waves & Fields: Viscous Fluid Drag
def acceleration(y, v):
    viscosity = 0.05
    rho = 1.0
    drag = 0.5 * rho * viscosity * v * abs(v)
    return -9.81 - drag`,
    exercisePrompt: 'Increase flow velocity to increase Reynolds number and trigger vortex street formation behind the cylinder.'
  },

  // 🟣 TIER 3 — MODERN PHYSICS
  {
    id: 'special_relativity',
    title: '1. Special Relativity',
    domain: 'modern',
    tier: 'undergrad',
    shortDesc: 'Lorentz transformations, time dilation, length contraction, and relativistic momentum boost.',
    fullDesc: 'Model particle dynamics at velocities approaching speed of light c, showing mass increase and coordinate boost.',
    mathLaTeX: [
      '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}',
      't\' = \\gamma \\left(t - \\frac{v x}{c^2}\\right)',
      'p = \\gamma m_0 v'
    ],
    whySimulateReason: 'At v -> c, constant force yields sub-luminal asymptotic acceleration instead of infinite speed growth.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 10.0,
      initialVelocity: 0.8,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Modern Physics: Relativistic Force & Acceleration
def acceleration(y, v):
    c = 1.0       # Normalized speed of light
    F_ext = 2.0   # Constant applied force
    gamma = 1.0 / ((1.0 - (v/c)**2)**0.5)
    return (F_ext / (1.0 * gamma**3))`,
    exercisePrompt: 'Apply a massive constant force F = 100 and observe how speed asymptotically approaches c = 1.0 without ever exceeding it.'
  },
  {
    id: 'blackbody_quantization',
    title: '2. Blackbody Radiation & Quantization',
    domain: 'modern',
    tier: 'highschool',
    shortDesc: 'Planck law of radiation, UV catastrophe resolution, Wien displacement, and energy quanta E = hf.',
    fullDesc: 'Simulate spectral energy distribution of blackbody thermal radiation across temperatures T.',
    mathLaTeX: [
      'I(\\nu, T) = \\frac{2h\\nu^3}{c^2} \\frac{1}{e^{\\frac{h\\nu}{k_B T}} - 1}',
      '\\lambda_{\\max} T = b',
      'E = h\\nu'
    ],
    whySimulateReason: 'Comparing classical Rayleigh-Jeans divergence with Planck quantum discrete state probability distribution.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 3000.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'euler'
    },
    defaultPythonCode: `# Modern Physics: Planck Spectral Energy
def spectral_radiance(freq, T=5800):
    h, c, kB = 6.626e-34, 3.0e8, 1.38e-23
    x = (h * freq) / (kB * T)
    return (2 * h * freq**3 / c**2) / (exp(x) - 1.0)`,
    exercisePrompt: 'Increase temperature from 3000 K (bulb filament) to 5800 K (Sun surface) and watch the peak wavelength shift left into visible light.'
  },
  {
    id: 'photoelectric_effect',
    title: '3. Photoelectric Effect',
    domain: 'modern',
    tier: 'highschool',
    shortDesc: 'Photon energy threshold, work function Φ, stopping voltage, and electron kinetic energy.',
    fullDesc: 'Simulate photo-electron ejection from a metal target bombarded by light quanta of frequency f.',
    mathLaTeX: [
      'K_{\\max} = hf - \\Phi',
      'e V_s = hf - \\Phi',
      'f_0 = \\frac{\\Phi}{h}'
    ],
    whySimulateReason: 'Light intensity dictates photo-current electron flux, whereas light frequency dictates individual electron stopping voltage.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 5.0,
      initialVelocity: 2.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'euler'
    },
    defaultPythonCode: `# Modern Physics: Photoelectron Kinetic Energy
def electron_velocity(freq, phi_ev=2.3):
    h_ev = 4.1357e-15 # eV*s
    E_photon = h_ev * freq
    if E_photon > phi_ev:
        KE = E_photon - phi_ev
        return (2 * KE / 1.0)**0.5
    return 0.0`,
    exercisePrompt: 'Lower photon frequency below cut-off f0 and confirm that zero photoelectrons are emitted regardless of light intensity.'
  },
  {
    id: 'quantum_wave_mechanics',
    title: '4. Quantum Wave Mechanics',
    domain: 'modern',
    tier: 'undergrad',
    shortDesc: 'Schrödinger equation, wavefunction ψ(x,t), quantum barrier tunneling, and probability density.',
    fullDesc: 'Numerically integrate time-dependent Schrödinger equation for a Gaussian wavepacket striking a potential barrier.',
    mathLaTeX: [
      'i\\hbar \\frac{\\partial \\psi}{\\partial t} = -\\frac{\\hbar^2}{2m}\\frac{\\partial^2 \\psi}{\\partial x^2} + V(x)\\psi',
      'P(x) = |\\psi(x)|^2'
    ],
    whySimulateReason: 'Quantum mechanical tunneling and wavepacket dispersion cannot be intuited through classical mechanics.',
    defaultParams: {
      gravity: 0.0,
      initialHeight: 20.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.0,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Modern Physics: Quantum Potential Barrier
def potential_barrier(x):
    # Barrier between x = 0.4 and x = 0.6
    if 0.4 <= x <= 0.6:
        return 50.0  # Barrier height V0
    return 0.0`,
    exercisePrompt: 'Decrease potential barrier height from 50.0 to 15.0 and watch quantum tunneling probability surge!'
  },
  {
    id: 'quantum_monte_carlo',
    title: '5. Quantum Monte Carlo & Probability',
    domain: 'modern',
    tier: 'researcher',
    shortDesc: 'Stochastic Langevin equations, ground state sampling, Markov chain Monte Carlo, and thermal noise.',
    fullDesc: 'Use diffusion Monte Carlo and stochastic differential equations to sample quantum ground state probability distributions.',
    mathLaTeX: [
      'dx = -\\nabla V(x) dt + \\sqrt{2 D} dW_t',
      'P(x) \\propto e^{-\\beta V(x)}',
      '\\langle E \\rangle = \\frac{1}{N} \\sum E_L(x_i)'
    ],
    whySimulateReason: 'High-dimensional quantum ground state sampling and thermal noise trajectories require stochastic Monte Carlo algorithms.',
    defaultParams: {
      gravity: 9.81,
      initialHeight: 20.0,
      initialVelocity: 0.0,
      dragCoefficient: 0.1,
      mass: 1.0,
      dt: 0.01,
      method: 'rk4'
    },
    defaultPythonCode: `# Modern Physics: Langevin Stochastic Diffusion
def acceleration(y, v):
    # Stochastic Langevin drag + harmonic force
    k, b = 10.0, 0.5
    return -k * y - b * v`,
    exercisePrompt: 'Vary temperature parameter T to observe thermal fluctuation diffusion around quantum potential wells.'
  }
];
