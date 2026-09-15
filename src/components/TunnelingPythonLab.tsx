import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Pause, Play, RotateCcw, Terminal } from 'lucide-react';
import { TunnelingCanvas } from './TunnelingCanvas';
import { MD_SLOTS, MdChart, MdSeries } from './MdChart';
import { usePlayback } from '../hooks/usePlayback';
import { layersFromCells, packetTransmission, transmission } from '../utils/tunnelingEngine';

const DEFAULT_CODE = `# Quantum tunneling: a wave packet meets a barrier.
# Units: nm, fs and eV. The particle is an electron.

import numpy as np

HB2M = 0.0380998      # eV·nm²: ħ²/2m for an electron
HBAR = 0.6582119569   # eV·fs: Planck's constant divided by 2π

N = 1024              # grid points
DX = 0.1              # nm between neighbouring points
DT = 0.02             # fs per step: must stay below ħ / (4·HB2M/DX² + highest V)
STEPS = 3500          # 70 fs in all

x = (np.arange(N) - N / 2 + 0.5) * DX   # the grid, with the barrier starting at x = 0

ENERGY = 0.5          # eV: the packet's energy
WIDTH = 1.5           # nm: how spread out the packet starts
START = -15.0         # nm: where it starts

def potential(x, t):
    """Step 1: the potential energy at every point at time t, in eV.
    Challenge 2: add a second barrier. Challenge 3: let V0 depend on t."""
    V0 = 1.0   # eV: barrier height
    L = 0.5    # nm: barrier width
    return np.where((x >= 0) & (x < L), V0, 0.0)

def step(psi_old, psi, V, dt):
    """Steps 2 and 3: the curvature at every point, then a leapfrog step of the Schrödinger equation."""
    curvature = np.zeros_like(psi)
    curvature[1:-1] = (psi[2:] - 2 * psi[1:-1] + psi[:-2]) / DX**2
    H_psi = -HB2M * curvature + V * psi
    return psi, psi_old - 2j * dt / HBAR * H_psi
`;

const PLAY_SECONDS = 10;
const WAVE = '#B8852F';
const pct = (v: number, digits = 1) => `${(100 * v).toFixed(digits)}%`;

interface LabOutput {
  dx: number;
  dt: number;
  steps: number;
  energy: number;
  /** Full-resolution potential at t = 0, for the exact answer. */
  potential: number[];
  /** Halved resolution, for drawing. */
  x: number[];
  frames: number[][];
  frameV: number[][] | null;
  plotV: number[];
  times: number[];
  left: number[];
  inside: number[];
  right: number[];
  moving: boolean;
  /** σ of the starting packet, nm. */
  width: number;
  stopped: number | null;
}

interface Analysis {
  x: Float64Array;
  frames: Float64Array[];
  peak: number;
  energyMax: number;
  view: [number, number];
  times: Float64Array;
  series: MdSeries[];
  transmitted: number;
  reflected: number;
  inside: number;
  exact: number | null;
  hasBarrier: boolean;
}

function analyse(out: LabOutput): Analysis {
  const x = Float64Array.from(out.x);
  const frames = out.frames.map((f) => Float64Array.from(f));
  let startPeak = 0;
  let peak = 0;
  frames.forEach((f, k) => {
    for (const d of f) {
      peak = Math.max(peak, d);
      if (k === 0) startPeak = Math.max(startPeak, d);
    }
  });
  const vMax = Math.max(0, ...out.potential);
  const last = out.times.length - 1;
  const layers = layersFromCells(out.potential, out.dx);
  const hasBarrier = layers.length > 0;
  const exact = !out.moving && hasBarrier ? packetTransmission(out.energy, out.width, (E) => transmission(E, layers)) : null;
  return {
    x,
    frames,
    peak: Math.min(peak, 2.2 * startPeak),
    energyMax: Math.max(0.5, 1.3 * vMax, 1.3 * out.energy),
    view: [Math.max(x[0], -30), Math.min(x[x.length - 1], 30)],
    times: Float64Array.from(out.times),
    series: [
      { key: 'right', label: 'past the barrier', color: MD_SLOTS[0], values: Float64Array.from(out.right) },
      { key: 'left', label: 'before it', color: MD_SLOTS[1], values: Float64Array.from(out.left) },
      { key: 'inside', label: 'inside or between', color: MD_SLOTS[2], values: Float64Array.from(out.inside) },
    ],
    transmitted: out.right[last],
    reflected: out.left[last],
    inside: out.inside[last],
    exact,
    hasBarrier,
  };
}

export const TunnelingPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<LabOutput | null>(null);
  const [status, setStatus] = useState('Loading Python…');
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
          if (cancelled) return;
          setStatus('Loading NumPy…');
          await py.loadPackage('numpy');
          if (cancelled) return;
          pyodideRef.current = py;
          setStatus('Python + NumPy ready');
          setIsReady(true);
        }
      } catch (e) {
        console.warn('Pyodide or NumPy unavailable; the tunneling lab needs both to run.', e);
        if (!cancelled) setStatus('Python unavailable');
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
      setError('Python and NumPy are still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    const runner = `
${code}

import json
import numpy as __np

def __potential_at(t):
    return __np.asarray(potential(x, t), dtype=float) * __np.ones(N)

def __halve(a, how="mean"):
    a = __np.asarray(a)
    if len(a) % 2:
        return a
    pairs = a.reshape(-1, 2)
    return pairs.max(axis=1) if how == "max" else pairs.mean(axis=1)

def __run_lab():
    V_start = __potential_at(0.0)
    moving = not __np.allclose(V_start, __potential_at(STEPS * DT / 2)) or not __np.allclose(V_start, __potential_at(STEPS * DT / 3))
    limit = HBAR / (4 * HB2M / DX**2 + __np.max(__np.abs(V_start)))
    if DT >= limit:
        raise ValueError(f"DT = {DT} fs is too big for this grid: the leapfrog step would blow up. Keep DT below {limit:.4f} fs, or use a bigger DX.")

    k0 = __np.sqrt(ENERGY / HB2M)
    psi0 = __np.exp(-(x - START)**2 / (4 * WIDTH**2) + 1j * k0 * x)
    psi0 = psi0 / __np.sqrt(__np.sum(__np.abs(psi0)**2) * DX)

    # Leapfrog needs two starting moments: take the first step with a Taylor expansion.
    def H(psi, V):
        c = __np.zeros_like(psi)
        c[1:-1] = (psi[2:] - 2 * psi[1:-1] + psi[:-2]) / DX**2
        return -HB2M * c + V * psi
    a = DT / HBAR
    h0 = H(psi0, V_start)
    psi_old, psi = psi0, psi0 - 1j * a * h0 - 0.5 * a * a * H(h0, V_start)

    region = __np.nonzero(V_start != 0)[0]
    if moving:
        region = __np.nonzero((V_start != 0) | (__potential_at(STEPS * DT / 2) != 0))[0]
    lo, hi = (region[0], region[-1]) if len(region) else (N, N)

    every = max(1, STEPS // 160)
    frames, frame_V, times, left, inside, right = [], [], [], [], [], []
    def record(p, t, V):
        d = __np.abs(p)**2
        frames.append(__np.round(__halve(d), 6).tolist())
        if moving:
            frame_V.append(__np.round(__halve(V, "max"), 4).tolist())
        times.append(t)
        left.append(float(__np.sum(d[:lo]) * DX))
        inside.append(float(__np.sum(d[lo:hi + 1]) * DX))
        right.append(float(__np.sum(d[hi + 1:]) * DX))

    record(psi0, 0.0, V_start)
    V = V_start
    stopped = None
    for s in range(1, STEPS):
        if moving:
            V = __potential_at(s * DT)
        result = step(psi_old, psi, V, DT)
        if not (isinstance(result, tuple) and len(result) == 2):
            raise ValueError("step() must return two arrays: the current wavefunction and the next one.")
        psi_old, psi = result
        if s % every == 0:
            if not __np.all(__np.isfinite(psi)):
                stopped = (s + 1) * DT
                break
            record(psi, (s + 1) * DT, __potential_at((s + 1) * DT) if moving else V)

    return json.dumps({
        "dx": DX, "dt": DT, "steps": STEPS, "energy": ENERGY,
        "potential": V_start.tolist(),
        "x": __halve(x).tolist(),
        "plotV": __np.round(__halve(V_start, "max"), 4).tolist(),
        "frames": frames, "frameV": frame_V if moving else None,
        "times": times, "left": left, "inside": inside, "right": right,
        "moving": bool(moving),
        "width": WIDTH,
        "stopped": stopped,
    })
__run_lab()
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
  const frame = analysis ? Math.min(analysis.frames.length - 1, Math.round((play.t / PLAY_SECONDS) * (analysis.frames.length - 1))) : 0;
  const gap = analysis?.exact != null ? Math.abs(analysis.transmitted - analysis.exact) : 0;
  const close = analysis?.exact != null && (gap <= 0.003 || gap <= 0.05 * analysis.exact);

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — a wave on a grid</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">{status}</span>
      </div>

      <p className="text-sm text-deepteal-soft">
        This is the lesson&apos;s loop, written out with NumPy: <code className="font-mono text-xs">potential(x, t)</code> sets the energy at
        every point, and <code className="font-mono text-xs">step(psi_old, psi, V, dt)</code> measures how the wavefunction curves there and
        takes a leapfrog step of the Schrödinger equation. Edit <code className="font-mono text-xs">potential</code> for the challenges — a
        second barrier, an irregular shape, a height that changes with <code className="font-mono text-xs">t</code> — and the lab checks
        your run against the exact answer whenever the barrier holds still.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3 min-w-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={28}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Quantum tunneling simulation code"
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
                {output.potential.length} points · {output.steps.toLocaleString('en-US')} steps · real Python
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
          {output && analysis && !error ? (
            <>
              <TunnelingCanvas
                x={analysis.x}
                potential={output.frameV ? output.frameV[frame] : output.plotV}
                traces={[{ density: analysis.frames[frame], color: WAVE }]}
                energy={output.energy}
                peak={analysis.peak}
                view={analysis.view}
                energyMax={analysis.energyMax}
                caption={`t = ${analysis.times[frame].toFixed(1)} fs`}
                leftNote={pct(output.left[frame])}
                rightNote={pct(output.right[frame])}
                label="Your simulation: the wave packet's probability density and the potential"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={play.toggle}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
                >
                  {play.playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {play.playing ? 'Pause' : play.finished ? 'Replay' : 'Play'}
                </button>
                <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                  through {pct(analysis.transmitted)} · back {pct(analysis.reflected)}
                </span>
              </div>

              <MdChart
                x={analysis.times}
                series={analysis.series}
                title="Where the probability is over time in your simulation: before the barrier, inside it, and past it"
                xName="time"
                xUnit="fs"
                yName="probability"
                yUnit="%"
                formatY={(v) => pct(v)}
                formatTick={(v) => String(Math.round(v * 100))}
                formatX={(v) => String(Number(v.toFixed(1)))}
                yDomain={[0, 1.05]}
                playhead={frame}
              />

              {output.stopped !== null && (
                <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans">
                  The wavefunction stopped being finite at t = {output.stopped.toFixed(2)} fs — the step blew up. Shrink DT.
                </p>
              )}

              {analysis.exact !== null && (
                <p
                  className={`${
                    close ? 'bg-sage-light/40 border-sage-dark text-deepteal-soft' : 'bg-gold-light/60 border-gold text-deepteal'
                  } border-l-2 rounded-r-lg p-3 text-xs font-sans flex items-start gap-2`}
                >
                  {close ? <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>
                    Your run sends {pct(analysis.transmitted, 2)} of the packet through. The exact answer for this barrier, averaged over the
                    packet&apos;s spread of energies, is {pct(analysis.exact, 2)}.{' '}
                    {close
                      ? 'The grid gets it right.'
                      : analysis.inside > 0.003
                        ? `${pct(analysis.inside, 1)} is still inside or between the barriers — raise STEPS and let it finish.`
                        : 'For a thick barrier every small grid error is magnified: try DX = 0.05 with DT = 0.005 and STEPS = 14000.'}
                  </span>
                </p>
              )}
              {output.moving && (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Your barrier changes with time, so there is no exact formula to compare with — this is where only the simulation can
                    answer. Run it again with the barrier held still and compare the two.
                  </span>
                </p>
              )}
              {!analysis.hasBarrier && !output.moving && (
                <p className="text-xs text-deepteal-soft italic">No barrier in the potential: the whole packet just travels through.</p>
              )}
            </>
          ) : (
            <div className="aspect-[4/3] rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                {isReady ? 'Run the code to watch the wave packet meet the barrier.' : `${status} The first load takes a few seconds.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
