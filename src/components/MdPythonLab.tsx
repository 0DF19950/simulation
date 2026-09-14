import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Pause, Play, RotateCcw, Terminal } from 'lucide-react';
import { MdCanvas, MdView } from './MdCanvas';
import { MD_INK, MD_SLOTS, MdChart, MdSeries } from './MdChart';
import { usePlayback } from '../hooks/usePlayback';
import { MASS_UNIT, MdRun, exactPeriod, ljPotential, measuredPeriod, turningPoints } from '../utils/mdEngine';

const DEFAULT_CODE = `# Molecular dynamics: every atom pushes or pulls on every other atom.
# Units: nm, ps, meV and atomic mass units (u). The atoms are argon.

import math

EPSILON = 10.3   # meV: depth of the energy well (bond strength)
SIGMA = 0.34     # nm: the atom's effective size
MASS = 39.95     # u: one argon atom
C = 10.3643      # meV per u·(nm/ps)²: turns ½mv² into meV and F/m into nm/ps²

DT = 0.01        # ps: one small time step
STEPS = 2500     # 25 ps in all

# Where each atom starts (nm) and how fast it moves (nm/ps; 1 nm/ps = 1000 m/s).
# Challenge 2: add a third atom, e.g. [-2.0, 0.1] moving at [0.08, 0.0].
positions = [[-0.25, 0.0], [0.25, 0.0]]
velocities = [[0.0, 0.0], [0.0, 0.0]]

def pair_force(r):
    """Lennard-Jones force at separation r, in meV/nm: positive pushes apart, negative pulls together."""
    s6 = (SIGMA / r) ** 6
    return 24 * EPSILON / r * (2 * s6 * s6 - s6)

def total_forces(positions):
    """Steps 1 and 2: the pairwise force from every other atom, added up."""
    n = len(positions)
    forces = [[0.0, 0.0] for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            dx = positions[i][0] - positions[j][0]
            dy = positions[i][1] - positions[j][1]
            r = math.sqrt(dx * dx + dy * dy)
            f = pair_force(r)
            forces[i][0] += f * dx / r
            forces[i][1] += f * dy / r
            forces[j][0] -= f * dx / r   # Newton's third law: equal and opposite
            forces[j][1] -= f * dy / r
    return forces

def step(positions, velocities, forces, dt):
    """Steps 3 and 4 (velocity Verlet): half a kick from a = F/m, a drift, new forces, the other half kick."""
    for i in range(len(positions)):
        for k in (0, 1):
            velocities[i][k] += 0.5 * dt * forces[i][k] / (MASS * C)
            positions[i][k] += velocities[i][k] * dt
    forces = total_forces(positions)
    for i in range(len(positions)):
        for k in (0, 1):
            velocities[i][k] += 0.5 * dt * forces[i][k] / (MASS * C)
    return forces
`;

const PLAY_SECONDS = 10;
const ATOM = '#B8852F';
const signedEnergy = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`;

interface LabOutput {
  epsilon: number;
  sigma: number;
  mass: number;
  dt: number;
  steps: number;
  times: number[];
  positions: number[][];
  velocities: number[][];
  stopped: number | null;
}

interface PairCheck {
  energy: number;
  inner: number;
  outer: number | null;
  period: number | null;
  runInner: number;
  runOuter: number;
  runPeriod: number | null;
}

interface Analysis {
  run: MdRun;
  sigma: number;
  epsilon: number;
  series: MdSeries[];
  relative: boolean;
  view: MdView;
  /** The exact two-body answer, when there are two atoms moving head-on. */
  pair: PairCheck | null;
  sideways: boolean;
}

function analyse(out: LabOutput): Analysis {
  const nFrames = out.positions.length;
  const n = out.positions[0].length / 2;
  const m = out.mass * MASS_UNIT;
  const positions = new Float64Array(nFrames * n * 2);
  const kinetic = new Float64Array(nFrames);
  const potential = new Float64Array(nFrames);
  const total = new Float64Array(nFrames);
  // Energies come from the true Lennard-Jones formula, not from the lab's code,
  // so a mistake in pair_force or step shows up as energy that isn't conserved.
  for (let f = 0; f < nFrames; f++) {
    const p = out.positions[f];
    const v = out.velocities[f];
    positions.set(p, f * n * 2);
    let ke = 0;
    for (const c of v) ke += c * c;
    let pe = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) pe += ljPotential(Math.hypot(p[2 * i] - p[2 * j], p[2 * i + 1] - p[2 * j + 1]), out.epsilon, out.sigma);
    }
    kinetic[f] = 0.5 * m * ke;
    potential[f] = pe;
    total[f] = kinetic[f] + pe;
  }
  let maxEnergyError = 0;
  for (const e of total) maxEnergyError = Math.max(maxEnergyError, Math.abs(e - total[0]));
  const run: MdRun = { n, nFrames, positions, times: Float64Array.from(out.times), kinetic, potential, total, maxEnergyError, blewUpAt: out.stopped };

  const relative = n > 2;
  const values = (a: Float64Array) => (relative ? a.map((x) => x - a[0]) : a);
  const series: MdSeries[] = [
    { key: 'kinetic', label: 'kinetic', color: MD_SLOTS[0], values: values(kinetic) },
    { key: 'potential', label: 'potential', color: MD_SLOTS[1], values: values(potential) },
    { key: 'total', label: 'total', color: MD_INK, values: values(total) },
  ];

  // Frame the starting arrangement with room to move; atoms that fly off leave the picture.
  const first = out.positions[0];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, first[2 * i]);
    maxX = Math.max(maxX, first[2 * i]);
    minY = Math.min(minY, first[2 * i + 1]);
    maxY = Math.max(maxY, first[2 * i + 1]);
  }
  const view = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, half: Math.max(0.8, Math.max(maxX - minX, maxY - minY) / 2 + 2 * out.sigma) };

  let pair: PairCheck | null = null;
  let sideways = false;
  if (n === 2) {
    const v = out.velocities[0];
    const dx = first[2] - first[0];
    const dy = first[3] - first[1];
    const wx = v[2] - v[0];
    const wy = v[3] - v[1];
    const r0 = Math.hypot(dx, dy);
    const closing = (wx * dx + wy * dy) / r0;
    sideways = Math.abs(wx * dy - wy * dx) / r0 > 1e-9 + 1e-6 * Math.hypot(wx, wy);
    if (!sideways) {
      const energy = ljPotential(r0, out.epsilon, out.sigma) + 0.5 * (m / 2) * closing * closing;
      const tp = turningPoints(energy, out.epsilon, out.sigma);
      const r = new Float64Array(nFrames);
      for (let f = 0; f < nFrames; f++) {
        const p = out.positions[f];
        r[f] = Math.hypot(p[2] - p[0], p[3] - p[1]);
      }
      pair = {
        energy,
        inner: tp.inner,
        outer: tp.outer,
        period: exactPeriod(energy, out.mass / 2, out.epsilon, out.sigma),
        runInner: Math.min(...r),
        runOuter: Math.max(...r),
        runPeriod: energy < 0 ? measuredPeriod(run.times, r) : null,
      };
    }
  }

  return { run, sigma: out.sigma, epsilon: out.epsilon, series, relative, view, pair, sideways };
}

export const MdPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<LabOutput | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ((window as any).loadPyodide) {
          const py = await (window as any).loadPyodide();
          if (!cancelled) {
            pyodideRef.current = py;
            setIsReady(true);
          }
        }
      } catch (e) {
        console.warn('Pyodide unavailable; the molecular dynamics lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async () => {
    setError('');
    setIsRunning(true);
    const py = pyodideRef.current;
    if (!py) {
      setError('Python is still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    const runner = `
${code}

import json
import math as __math

def __run_md():
    n = len(positions)
    if n < 2:
        raise ValueError("positions needs at least two atoms.")
    if len(velocities) != n:
        raise ValueError(f"positions has {n} atoms but velocities has {len(velocities)}: give every atom a velocity.")
    steps = int(STEPS)
    every = max(1, steps // 1000)
    def snapshot():
        return [float(c) for p in positions for c in p], [float(c) for v in velocities for c in v]
    p, v = snapshot()
    frames, speeds, times = [p], [v], [0.0]
    stopped = None
    forces = total_forces(positions)
    for s in range(1, steps + 1):
        forces = step(positions, velocities, forces, DT)
        if forces is None:
            raise ValueError("step() must return the new forces, so the next step can reuse them.")
        if s % every == 0:
            p, v = snapshot()
            if not all(__math.isfinite(c) for c in p + v):
                stopped = s * DT
                break
            frames.append(p)
            speeds.append(v)
            times.append(s * DT)
    return json.dumps({
        "epsilon": EPSILON, "sigma": SIGMA, "mass": MASS, "dt": DT, "steps": steps,
        "times": times, "positions": frames, "velocities": speeds, "stopped": stopped,
    })
__run_md()
`;

    try {
      // A fresh namespace for every run. Pyodide otherwise keeps one global
      // namespace for the whole page, so a function renamed or deleted in the
      // editor would keep running from the previous run.
      const namespace = py.globals.get('dict')();
      let json: string;
      try {
        json = await py.runPythonAsync(runner, { globals: namespace });
      } finally {
        namespace.destroy();
      }
      setOutput(JSON.parse(json));
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  const analysis = useMemo(() => (output ? analyse(output) : null), [output]);
  const play = usePlayback(PLAY_SECONDS, analysis);
  const frame = analysis ? Math.min(analysis.run.nFrames - 1, Math.round((play.t / PLAY_SECONDS) * (analysis.run.nFrames - 1))) : 0;
  const driftShare = analysis ? analysis.run.maxEnergyError / (analysis.epsilon * (analysis.run.n > 2 ? analysis.run.n : 1)) : 0;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — forces, then a small step</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">{isReady ? 'Pyodide ready' : 'Loading Python…'}</span>
      </div>

      <p className="text-sm text-deepteal-soft">
        This is the lesson&apos;s loop, written out: <code className="font-mono text-xs">total_forces(positions)</code> adds up{' '}
        <code className="font-mono text-xs">pair_force(r)</code> over every pair, and{' '}
        <code className="font-mono text-xs">step(positions, velocities, forces, dt)</code> turns the forces into accelerations and moves
        every atom a little. Edit <code className="font-mono text-xs">positions</code> and{' '}
        <code className="font-mono text-xs">velocities</code> for the challenges — the lab checks your run against the exact answer when
        there is one, and against energy conservation always.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3 min-w-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={26}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Molecular dynamics simulation code"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={run}
              disabled={isRunning}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-gold text-deepteal font-bold hover:bg-gold-hover transition-colors disabled:opacity-60"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Running' : 'Run simulation'}
            </button>
            <button
              onClick={() => {
                setCode(DEFAULT_CODE);
                setError('');
              }}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset code
            </button>
            {output && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {analysis?.run.n} atoms · {output.steps.toLocaleString('en-US')} steps · real Python
              </span>
            )}
          </div>
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed overflow-x-auto">{error}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          {analysis && !error ? (
            <>
              <div className="w-full max-w-[340px] mx-auto space-y-2">
                <MdCanvas
                  positions={analysis.run.positions}
                  n={analysis.run.n}
                  frame={frame}
                  sigma={analysis.sigma}
                  view={analysis.view}
                  colors={[ATOM]}
                  bondLength={analysis.run.n > 2 ? 1.35 * analysis.sigma : undefined}
                  label={`Your simulation: ${analysis.run.n} atoms`}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={play.toggle}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
                  >
                    {play.playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {play.playing ? 'Pause' : play.finished ? 'Replay' : 'Play'}
                  </button>
                  <span className="font-mono text-[10px] text-deepteal-soft ml-auto">t = {analysis.run.times[frame].toFixed(1)} ps</span>
                </div>
              </div>

              <MdChart
                x={analysis.run.times}
                series={analysis.series}
                title={analysis.relative ? 'Change in energy since the start of your simulation' : 'Energy of the two atoms in your simulation'}
                xName="time"
                xUnit="ps"
                yName={analysis.relative ? 'energy change' : 'energy'}
                yUnit="meV"
                formatY={(v) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`}
                formatX={(v) => String(Number(v.toFixed(2)))}
                playhead={frame}
                endLabels
              />

              {analysis.run.blewUpAt !== null && (
                <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans">
                  The positions stopped being numbers at t = {analysis.run.blewUpAt.toFixed(2)} ps — two atoms almost certainly ended up on
                  top of each other. Start them further apart, or shrink DT.
                </p>
              )}

              {driftShare < 0.01 ? (
                <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
                  <span>
                    Total energy, from the Lennard-Jones formula, stays within {(driftShare * 100).toFixed(2)}% of ε
                    {analysis.run.n > 2 ? ' per atom' : ''} for the whole run: kinetic and potential energy trade places, and the total
                    holds still.
                  </span>
                </p>
              ) : (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
                  Total energy drifted by {(driftShare * 100).toFixed(1)}% of ε{analysis.run.n > 2 ? ' per atom' : ''}. If you changed{' '}
                  <code className="font-mono">step()</code>, check its order — half a kick, a drift, new forces, the other half kick — or try
                  a smaller DT.
                </p>
              )}

              {analysis.pair && (
                <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
                  <span>
                    {analysis.pair.outer !== null ? (
                      <>
                        Exact answer for this pair (E = {signedEnergy(analysis.pair.energy)} meV, bound): turning points{' '}
                        {analysis.pair.inner.toFixed(3)} and {analysis.pair.outer.toFixed(3)} nm
                        {analysis.pair.period !== null && <>, period {analysis.pair.period.toFixed(2)} ps</>}. Your run:{' '}
                        {analysis.pair.runInner.toFixed(3)} and {analysis.pair.runOuter.toFixed(3)} nm
                        {analysis.pair.runPeriod !== null && <>, period {analysis.pair.runPeriod.toFixed(2)} ps</>}.
                      </>
                    ) : (
                      <>
                        E = {signedEnergy(analysis.pair.energy)} meV is above zero, so this pair is free: exactly, the atoms get no closer than{' '}
                        {analysis.pair.inner.toFixed(3)} nm; your run reaches {analysis.pair.runInner.toFixed(3)} nm before they part for
                        good.
                      </>
                    )}
                  </span>
                </p>
              )}
              {analysis.sideways && (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    These two atoms also move sideways, so they swing around each other as well as in and out. That is still exactly
                    solvable, but the turning points no longer come from U(r) = E alone, so the lab skips the exact check.
                  </span>
                </p>
              )}
              {analysis.run.n > 2 && (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    No exact answer to compare with: {analysis.run.n} mutually interacting atoms is a many-body problem. Energy
                    conservation, above, is the check real simulations lean on instead.
                  </span>
                </p>
              )}
            </>
          ) : (
            <div className="aspect-[4/3] rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">Run the code to watch your atoms move.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
