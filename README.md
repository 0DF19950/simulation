# Philomathlab

**philomathlab** is a platform for learning simulation itself — math, physics,
and programming together — rather than picking it up as a side effect of a
research project.

Every topic is meant to arrive as three things at once: a lesson, a derivation
you can follow, and a real Python lab that runs in the browser. Topics ship at
up to three depths — High School, Undergraduate, and Researcher — because a
falling body is a falling body whether you are sixteen or writing a paper.
What changes is how far down the model you go.

Six topics are built so far, all at high-school depth (falling body also ships
at undergraduate depth): falling bodies, projectile motion, rocket launches,
orbital motion, the double pendulum, and wave interference. Each one follows
the same arc — build intuition, derive an exact formula, find the case where
that formula stops applying, then simulate — and each one ends in a real
Python lab.

## What's here

### Landing page

The catalogue of topics, each card carrying its domain, a blurb, and links to
whichever depths exist. Topics that are only planned render dimmed rather than
pretending to be clickable.

### Instrument View widgets

Every lesson opens with a small live-telemetry panel next to the intro text —
a real simulation already running, before any theory, not the full lab below.
Press Run and watch the numbers move: it's the same engine and the same
canvas renderer the lesson's own interactive simulator uses further down, just
wrapped in a compact instrument-panel chrome (canvas, four telemetry rows,
Run/Reset). It exists purely to make "why should I care" concrete in the first
five seconds on the page.

### Lesson 1 — What is Falling? (High School)

- **The idea** — why a falling object speeds up instead of moving at a
  constant speed.
- **Where the equation comes from** — deriving the second-degree equation of
  motion step by step, rendered with KaTeX.
- **Same equation, different planet** — pick Earth, Moon, Mars, Jupiter,
  Europa, or a (scaled) neutron star and see gravity's effect on the same
  drop.

### Lesson 1 — From Analytical Models to Numerical Simulation (Undergraduate)

The same falling body, taken to the point where an analytical solution stops
being convenient. Fifteen parts, with a contents rail:

- **Start from the governing equation** — Newton's second law as a
  differential equation, not a memorised kinematic formula.
- **Equation to computational model** — discretising time, deriving explicit
  Euler from the difference quotient.
- **Numerical error** — truncation, round-off, and model error kept distinct.
  The third cannot be fixed by shrinking the time step.
- **Quadratic drag and terminal velocity** — the signed drag form
  `−½ρC_dA·v|v|`, the coupled first-order system, and `v_t = √(2mg/ρC_dA)`.
- **Euler–Cromer and RK4** — including whether the numerical method itself
  influences the physics you observe.
- **A non-constant atmosphere and non-constant gravity** — `ρ(h) = ρ₀e^(−h/H)`
  and `g(h) = GM/(R_E+h)²`, then both together.
- **Verification vs. validation** — did we solve the equations correctly, and
  do the equations represent reality? A program can be numerically correct and
  physically inaccurate.
- **The Reynolds number** — why even the choice of drag equation is part of
  the modelling process.

Two of the lesson's experiments are interactive rather than tables to fill in
by hand:

- **Numerical experiment** — runs the 50 m vacuum drop across
  Δt = 1 … 0.001 s under Euler, Euler–Cromer, and RK4, against the exact
  answer. Euler's error falls by ten for every factor of ten in Δt; RK4 gets
  further on a fraction of the force evaluations.
- **Terminal velocity explorer** — sliders for m, C_d, A, and ρ driving both
  the predicted `v_t` and a live velocity curve against the vacuum case.

### Lesson 2 — Projectile Motion (High School)

The falling body gains a second, independent direction. Seven parts, with a
contents rail:

- **Two motions at once** — horizontal velocity never changes; vertical motion
  is exactly Lesson 1 again.
- **Splitting the launch** — `v₀ₓ = v₀cos θ`, `v₀ᵧ = v₀sin θ`.
- **Building the mathematical model** — `x(t)` and `y(t)` derived from the
  split components, with a worked example.
- **Different launch angles** — why 30° and 60° give the same range, and what
  45° has to do with it.
- **Why equations eventually fail** — quadratic drag couples x and y back
  together, so the closed form stops applying.
- **How a simulation thinks**, and **real-world applications**.

- **Projectile simulator** — launch speed, angle, Earth/Moon/Mars gravity, air
  resistance, and wind, with Euler vs. RK4. With no drag, the simulator
  measures the peak range and checks it against the closed-form formula from
  Part 3 — a real check, not a label, so it correctly stops matching the
  moment drag is switched on.
- **Python lab** — `acceleration(x, y, vx, vy)` returning `(ax, ay)`.

### Lesson 3 — Rocket Launch (High School)

The object's own mass stops being constant. Seven parts, with a contents rail:

- **Forces on a rocket** — thrust, weight, and drag, and why a changing mass
  breaks `F = ma`.
- **The changing-mass problem** — `F = d(mv)/dt` in place of `F = ma`.
- **Building the mathematical model** — the thrust equation
  `F = vₑ·(dm/dt)`, `a = F/m − g` (mass in the denominator — this is why a
  rocket appears to leap forward near the end of its burn), and the
  Tsiolkovsky rocket equation `Δv = vₑ·ln(m₀/m_f)`.
- **Different rockets** — solid, kerosene/oxygen, hydrogen/oxygen, and ion
  engines, by typical exhaust velocity.
- **Why equations eventually fail** — gravity loss, the gravity turn (a
  two-direction problem again, now with shrinking mass on top), changing air
  density, and staging.
- **How a simulation thinks**, and **real-world applications**.

- **Rocket simulator** — mass ratio, burn time, engine presets,
  Earth/Mars gravity, a gravity-turn toggle, and drag. For a straight-up,
  drag-free burn it compares the simulated burnout speed against the exact
  closed form (Tsiolkovsky's Δv minus the gravity lost while burning) and
  reports how much speed gravity actually cost.
- **Python lab** — `acceleration(t, m, vx, vy)` returning `(ax, ay)`; `t` and
  `m` are supplied by the loop since a rocket's physics genuinely depends on
  both.

### Lesson 4 — Orbital Motion (High School)

Throw something sideways fast enough and it never lands. Ten parts, with a
contents rail:

- **Describing orbital motion** — why one dimension is no longer enough, and
  why an object can accelerate while its speed stays constant.
- **Gravity** — `F = GMm/r²`, and what the inverse square actually costs you.
- **From gravity to orbital motion** — `a = GM/r²`, with the satellite's own
  mass dropping out.
- **Circular orbits** — deriving `v = √(GM/r)` by setting gravity equal to the
  centripetal acceleration.
- **How an orbiting object moves** — the coupled pair `dr/dt = v` and
  `dv/dt = −GM·r/r³`.
- **How a simulation thinks** — the six-step update loop, written out.
- **Why initial velocity matters** — too slow, just right, and fast enough to
  escape.
- **Circular vs. elliptical**, **why simulation matters more**, and
  **real-world applications**.

- **Orbit simulator** — set an altitude and a starting speed and watch gravity
  do the rest. Presets cover the lesson's four prediction cases; the readout
  reports periapsis, apoapsis, eccentricity and period, and classifies the
  result as circular, elliptical, impact, escape, or a straight line. Because
  orbital energy is conserved in reality, the simulator measures its own drift
  and warns when the *integrator* — not the physics — is bending the orbit,
  which is what makes explicit Euler visibly spiral outward.
- **Python lab in two dimensions** — see below.

### Lesson 5 — Double Pendulum (High School)

The first topic in the course with no closed-form solution at all, even in
its cleanest, frictionless form. Seven parts, with a contents rail:

- **One arm vs. two** — the single pendulum's clean, repeating
  `θ(t) = θ₀·cos(√(g/L)·t)`, kept as a point of comparison.
- **Why the second arm changes everything** — each arm is simultaneously a
  cause and a result of the other's motion.
- **Building the mathematical model** — the coupled, nonlinear equations
  `α₁ = f₁(θ₁, θ₂, ω₁, ω₂)`, `α₂ = f₂(θ₁, θ₂, ω₁, ω₂)` — exact, but with no
  known way to untangle them into closed-form functions of time.
- **Sensitivity to starting conditions** — the table from the source lesson,
  made concrete rather than asserted (see the simulator below).
- **Chaos is not the same as randomness** — deterministic chaos: identical
  starting conditions always produce identical motion; the problem is that no
  two *measured* starting conditions are ever truly identical.
- **How a simulation thinks**, and **real-world applications** — weather,
  legged-robot control, structural sway, ecosystem dynamics, turbulence.

- **Double pendulum simulator** — its central feature releases a second
  pendulum just 0.5° away from the first and reports how far apart their
  lower bobs end up. There's no formula left to validate against, so the
  simulator's only self-check is mechanical energy conservation (frictionless,
  so it should hold exactly); RK4 holds steady, Euler visibly drifts.
- **Python lab** — `angular_acceleration(theta1, theta2, omega1, omega2)`
  returning `(alpha1, alpha2)`. Unlike the other labs, `L1`, `L2`, `m1`, `m2`
  are editable constants in the same code block rather than fixed by the
  shell, since two of the challenges are specifically about changing them.

### Lesson 6 — Wave Interference (High School)

A structurally different engine from every lesson before it: a traveling
wave's value at a point is known in closed form, so nothing here gets
integrated over time — the field is evaluated directly. What makes it a
*simulation* is scale: many sources, their reflections, and every point on a
whole grid, summed together every frame. Seven parts, with a contents rail:

- **Describing a wave** — amplitude, wavelength, frequency, and
  `y(t) = A·sin(2πft + φ)`.
- **The principle of superposition** — `y_total(t) = y₁(t) + y₂(t)`, no
  further physics required.
- **Building the mathematical model** — two identical sources combine to the
  exact, closed-form `y_total(t) = 2A·cos(Δφ/2)·sin(2πft + Δφ/2)`.
- **Different phase differences** — constructive at Δφ = 0, destructive at
  Δφ = 180°, partial in between.
- **Why equations eventually fail** — many sources across an entire surface,
  plus reflecting boundaries, defeat any single formula.
- **How a simulation thinks**, and **real-world applications** — noise
  cancellation, room acoustics, antenna arrays, gravitational-wave
  interferometers, seismic imaging.

- **Wave interference simulator** — a live 2D heatmap (not a trajectory
  canvas), with phase difference, amplitude, wavelength, a third source, a
  reflecting wall, and a frequency mismatch. With two identical sources and no
  wall, it measures the actual peak amplitude at a probe point equidistant
  from both sources by sampling across several seconds — not just applying
  the formula — and checks it against Part 3's closed form.
- **Python lab** — no time-stepping loop; a `SOURCES` list and
  `total_displacement(x, y, t, sources)` evaluated once across an 80×80 grid,
  matching the lesson's own description of the algorithm rather than forcing
  an ODE shape onto a problem that doesn't have one.

### The Python lab

Edit the acceleration (or, for Lesson 6, the superposition) function and run
it. Python executes for real, in the browser, via
[Pyodide](https://pyodide.org/) (WebAssembly) — no install, no backend
server. Python errors come back as real tracebacks pointing at the line you
wrote. The function signature changes with what the physics actually needs:

| Lesson | Signature |
| --- | --- |
| 1 — Falling | `acceleration(y, v)` |
| 2 — Projectile | `acceleration(x, y, vx, vy)` |
| 3 — Rocket | `acceleration(t, m, vx, vy)` |
| 4 — Orbital | `acceleration(x, y, vx, vy)` |
| 5 — Double pendulum | `angular_acceleration(theta1, theta2, omega1, omega2)` |
| 6 — Wave interference | `total_displacement(x, y, t, sources)` |

Lesson 1's lab also carries a synced canvas visualizer and live charts
(height, velocity, energy) alongside the code editor.

## Routes

Routing is hash-based, with no router dependency. Hash routes survive GitHub
Pages' static hosting under the `/simulation/` base path without a `404.html`
redirect.

| Route | Page |
| --- | --- |
| `#/` | Landing page |
| `#/lesson/falling` | Lesson 1, high school |
| `#/lesson/falling/undergrad` | Lesson 1, undergraduate |
| `#/lesson/projectile` | Lesson 2, high school |
| `#/lesson/rocket` | Lesson 3, high school |
| `#/lesson/orbit` | Lesson 4, high school |
| `#/lesson/double-pendulum` | Lesson 5, high school |
| `#/lesson/wave-interference` | Lesson 6, high school |

## Adding a topic

Topics are data. Edit [`src/data/topics.ts`](src/data/topics.ts) — one array,
one entry per topic:

```ts
{
  id: 'oscillations',
  title: 'Oscillations & Waves',
  domain: 'waves',                    // 'classical' | 'waves' | 'modern'
  blurb: '…',
  status: 'planned',                  // 'live' renders a clickable card
  icon: Waves,                        // any lucide-react icon
  tiers: [
    { tier: 'highschool' },           // no route yet — shown muted
    { tier: 'undergrad' },
    { tier: 'researcher' },
  ],
}
```

To bring a topic live you need three things: set `status: 'live'`, give the
topic a top-level `route` (the card's own link — without it the card title
links nowhere), and give each finished depth its own `route` in `tiers`. Then
add the matching case to `resolveView` in [`src/App.tsx`](src/App.tsx), which
maps a hash route to a page.

Match the deeper route first there — `#/lesson/falling` is a prefix of
`#/lesson/falling/undergrad`, so checking it first would swallow the other.

## Running it locally

```bash
npm install
```

```bash
npm run dev
```

Then open the local URL Vite prints (defaults to `http://localhost:3000`).

## Building and deploying

```bash
npm run build
```

This outputs a static site to `dist/` — deployable anywhere that serves static
files (GitHub Pages, Netlify, Vercel, etc.).

Pushing to `main` deploys automatically: `.github/workflows/deploy.yml` builds
the site and publishes it to GitHub Pages. `npm run deploy` publishes from a
working copy instead, via the `gh-pages` package.

The `base` path in `vite.config.ts` is `/simulation/` and must match the
repository name for the GitHub Pages URL to resolve. Any asset referenced by a
literal string (an `<img src="/…">`, for instance) needs to go through
`import.meta.env.BASE_URL` instead, or it will 404 the moment the site is
served from a subpath rather than a domain root.

## Project structure

```
src/
  App.tsx                       Hash router + the high-school falling-body page
  vite-env.d.ts                 Vite's ambient types (import.meta.env, etc.)
  data/topics.ts                The topic catalogue (edit this to add topics)
  hooks/useFallingLab.ts        Shared lab state: params, trajectory, Pyodide
  utils/
    simulationEngine.ts         1D falling-body integrator
    projectileEngine.ts         2D projectile integrator (Euler/RK4, drag, wind)
    rocketEngine.ts             Variable-mass 2D integrator (thrust, gravity turn)
    orbitalEngine.ts            2D orbital integrator (RK4/Euler, Moon, drift)
    doublePendulumEngine.ts     Coupled nonlinear pendulum integrator
    waveInterferenceEngine.ts   Direct field evaluation (no time integration)
  components/
    LandingPage.tsx             Topic catalogue
    LessonPrimitives.tsx        Card / equation / symbol-table / predict blocks
    LessonTierNav.tsx           Depth switcher, driven by data/topics.ts
    PreLessonQuiz.tsx           Shared "before you calculate" quiz component
    SimulationChallenges.tsx    Shared challenge-list component
    FallingBallLesson.tsx       Lesson 1 body, high school
    FallingInstrumentWidget.tsx Lesson 1's instrument-view widget
    FallingLessonUG.tsx         Lesson 1 body, undergraduate
    FallingUGPage.tsx           Lesson 1 page shell, undergraduate
    NumericalExperiment.tsx     Convergence + method comparison (interactive)
    TerminalVelocityExplorer.tsx
    ProjectileLesson.tsx        Lesson 2 body
    ProjectilePage.tsx          Lesson 2 page shell
    ProjectileSimulator.tsx     Interactive projectile explorer
    ProjectileCanvas.tsx        Ground-based trajectory canvas (shared with Rocket)
    ProjectilePythonLab.tsx     2D Pyodide code lab
    ProjectileInstrumentWidget.tsx
    RocketLesson.tsx            Lesson 3 body
    RocketPage.tsx              Lesson 3 page shell
    RocketSimulator.tsx         Interactive rocket-launch explorer
    RocketPythonLab.tsx         Variable-mass Pyodide code lab
    RocketInstrumentWidget.tsx
    OrbitalLesson.tsx           Lesson 4 body
    OrbitalPage.tsx             Lesson 4 page shell
    OrbitSimulator.tsx          Interactive orbit explorer
    OrbitCanvas.tsx             Earth-centred trajectory canvas (shared)
    OrbitalPythonLab.tsx        2D Pyodide code lab
    OrbitalInstrumentWidget.tsx
    DoublePendulumLesson.tsx    Lesson 5 body
    DoublePendulumPage.tsx      Lesson 5 page shell
    DoublePendulumSimulator.tsx Interactive chaos/sensitivity explorer
    DoublePendulumCanvas.tsx    Pivot-centred rendering with twin-pendulum overlay
    DoublePendulumPythonLab.tsx Pyodide code lab
    DoublePendulumInstrumentWidget.tsx
    WaveInterferenceLesson.tsx  Lesson 6 body
    WaveInterferencePage.tsx    Lesson 6 page shell
    WaveInterferenceSimulator.tsx  Interactive interference-pattern explorer
    WaveFieldCanvas.tsx         2D heatmap renderer (shared)
    WaveInterferencePythonLab.tsx  Pyodide code lab (single-snapshot, no time loop)
    WaveInterferenceInstrumentWidget.tsx
    PythonLabEditor.tsx         1D Pyodide code lab (Lesson 1)
    …
```

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, with Pyodide for real
in-browser Python execution, KaTeX for equations, and Recharts for Lesson 1's
live plots.

## Status

Early prototype. Six topics are live at high-school depth (falling bodies
also ships at undergraduate depth). The researcher depth, the undergraduate
depth for lessons 2–6, and the remaining topics on the landing page
(oscillations & waves as a general topic, quantum motion) are still
placeholders. Feedback welcome.
