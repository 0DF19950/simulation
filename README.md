# Philomathlab — Lesson 1: What is Falling?

A single interactive physics lesson: the concept, the equation, gravity across
different planets, and a live in-browser Python simulation lab — all on one
page.

This is an early piece of **philomathlab**, a platform for learning
simulation itself — math, physics, and programming together — rather than
picking it up as a side effect of a research project.

## What's on this page

- **The idea** — why a falling object speeds up instead of moving at a
  constant speed.
- **Where the equation comes from** — deriving the second-degree equation of
  motion step by step, rendered with KaTeX.
- **Same equation, different planet** — pick Earth, Moon, Mars, Jupiter,
  Europa, or a (scaled) neutron star and see gravity's effect on the same
  drop.
- **A real Python lab** — edit the `acceleration(y, v)` function and run it.
  Python executes for real, in the browser, via [Pyodide](https://pyodide.org/)
  (WebAssembly) — no install, no backend server. A synced canvas visualizer
  and live charts (height, velocity, energy) update from the actual computed
  trajectory.
- **Three depths, one lab** — the code lab includes High School, Undergraduate
  (drag, RK4), and Researcher (atmospheric density, stochastic forces)
  starting points for the same falling-body problem.

## Running it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (defaults to `http://localhost:3000`).

## Building for deployment

```bash
npm run build
```

This outputs a static site to `dist/` — deployable anywhere that serves
static files (GitHub Pages, Netlify, Vercel, etc.).

### Deploying to GitHub Pages

1. `npm run build`
2. Push the contents of `dist/` to a `gh-pages` branch (or use a GitHub
   Action such as `peaceiris/actions-gh-pages`).
3. Enable GitHub Pages for that branch in the repo settings.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, with Pyodide for real
in-browser Python execution, KaTeX for equations, and Recharts for the live
plots.

## Status

Early prototype. Part of a larger plan to build out High School,
Undergraduate, and Researcher pages, each with their own lesson depth, for
the same simulation topics. Feedback welcome.
