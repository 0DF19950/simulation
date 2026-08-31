# Philomathlab

**philomathlab** is a platform for learning simulation itself — math, physics,
and programming together — rather than picking it up as a side effect of a
research project.

Every topic is meant to arrive as three things at once: a lesson, a derivation
you can follow, and a real Python lab that runs in the browser. Topics ship at
up to three depths — High School, Undergraduate, and Researcher — because a
falling body is a falling body whether you are sixteen or writing a paper.
What changes is how far down the model you go.

Currently one topic is built, at two of its three depths.

## What's here

### Landing page

The catalogue of topics, each card carrying its domain, a blurb, and links to
whichever depths exist. Topics that are only planned render dimmed rather than
pretending to be clickable.

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

### The Python lab

Edit the `acceleration(y, v)` function and run it. Python executes for real,
in the browser, via [Pyodide](https://pyodide.org/) (WebAssembly) — no install,
no backend server. A synced canvas visualizer and live charts (height,
velocity, energy) update from the actual computed trajectory. The lab appears
on both lessons, opening on parameters appropriate to the depth: no drag and
explicit Euler for high school, quadratic drag and RK4 for undergraduate.

## Routes

Routing is hash-based, with no router dependency. Hash routes survive GitHub
Pages' static hosting under the `/simulation/` base path without a `404.html`
redirect.

| Route | Page |
| --- | --- |
| `#/` | Landing page |
| `#/lesson/falling` | Lesson 1, high school |
| `#/lesson/falling/undergrad` | Lesson 1, undergraduate |

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
repository name for the GitHub Pages URL to resolve.

## Project structure

```
src/
  App.tsx                    Hash router + the high-school lesson page
  data/topics.ts             The topic catalogue (edit this to add topics)
  hooks/useFallingLab.ts     Shared lab state: params, trajectory, Pyodide
  components/
    LandingPage.tsx          Topic catalogue
    FallingBallLesson.tsx    Lesson 1 body, high school
    FallingUGPage.tsx        Lesson 1 page shell, undergraduate
    FallingLessonUG.tsx      Lesson 1 body, undergraduate
    NumericalExperiment.tsx  Convergence + method comparison (interactive)
    TerminalVelocityExplorer.tsx
    PythonLabEditor.tsx      Pyodide-backed code editor
    …
```

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, with Pyodide for real
in-browser Python execution, KaTeX for equations, and Recharts for the live
plots.

## Status

Early prototype. Lesson 1 exists at high-school and undergraduate depth; the
researcher depth and the remaining topics are still placeholders on the
landing page. Feedback welcome.
