import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { WaveFieldCanvas } from './WaveFieldCanvas';

const GRID_RES = 80;
const W = 10;
const H = 6;

const DEFAULT_CODE = `# Wave interference: superposition of point sources.
# Each source is a dict: x, y (m), amplitude (m), frequency (Hz), wavelength (m), phase (rad).

import math

SOURCES = [
    {"x": 3.5, "y": 3.0, "amplitude": 0.02, "frequency": 0.6, "wavelength": 2.5, "phase": 0.0},
    {"x": 6.5, "y": 3.0, "amplitude": 0.02, "frequency": 0.6, "wavelength": 2.5, "phase": math.pi / 3},  # 60 degrees
    # Try adding a third source, or a wall by adding a mirror-image source
    # with a flipped position and a pi phase shift.
]

def wave(x, y, t, source):
    r = ((x - source["x"])**2 + (y - source["y"])**2) ** 0.5
    return source["amplitude"] * math.sin(2*math.pi*(source["frequency"]*t - r/source["wavelength"]) + source["phase"])

def total_displacement(x, y, t, sources):
    return sum(wave(x, y, t, s) for s in sources)
`;

interface WaveSnapshot {
  values: number[];
  gridRes: number;
  maxAmplitude: number;
  sources: { x: number; y: number }[];
}

export const WaveInterferencePythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [snapshot, setSnapshot] = useState<WaveSnapshot | null>(null);
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
        console.warn('Pyodide unavailable; the wave interference lab needs it to run.', e);
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
import json

${code}

def __run_wave():
    GRID_RES = ${GRID_RES}
    W, H = ${W}.0, ${H}.0
    T_SNAPSHOT = 0.0
    values = []
    for j in range(GRID_RES):
        y = (j / (GRID_RES - 1)) * H
        for i in range(GRID_RES):
            x = (i / (GRID_RES - 1)) * W
            values.append(total_displacement(x, y, T_SNAPSHOT, SOURCES))
    max_amp = max(sum(s["amplitude"] for s in SOURCES), 1e-9)
    return json.dumps({
        "values": values,
        "gridRes": GRID_RES,
        "maxAmplitude": max_amp,
        "sources": [{"x": s["x"], "y": s["y"]} for s in SOURCES],
    })

__run_wave()
`;

    try {
      const json = await py.runPythonAsync(runner);
      const parsed: WaveSnapshot = JSON.parse(json);
      if (parsed.values.length === 0) throw new Error('The simulation produced no grid points.');
      setSnapshot(parsed);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — superposition over a grid</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        No loop over time here — <code className="font-mono text-xs">total_displacement(x, y, t, sources)</code>{' '}
        is evaluated once at every point on an {GRID_RES}×{GRID_RES} grid, at a single instant.
        That direct sum is exactly what &ldquo;How a Simulation Thinks&rdquo; describes: each
        source's contribution, added by superposition, at every point. Edit{' '}
        <code className="font-mono text-xs">SOURCES</code> for challenges 1–3 and 5; add a
        mirror-image source (flipped position, phase + π) for challenge 4's wall.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={16}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Wave superposition function"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={run}
              disabled={isRunning}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-gold text-deepteal font-bold hover:bg-gold-hover transition-colors disabled:opacity-60"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
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
            {snapshot && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {snapshot.gridRes * snapshot.gridRes} points · real Python
              </span>
            )}
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {error}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {snapshot ? (
            <WaveFieldCanvas
              values={Float32Array.from(snapshot.values)}
              gridRes={snapshot.gridRes}
              maxAmplitude={snapshot.maxAmplitude}
              width={W}
              height={H}
              sources={snapshot.sources}
              label="Interference pattern computed by your Python code"
            />
          ) : (
            <div className="aspect-square rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to render the interference pattern it produces.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            Snapshot at t = 0 · {W}×{H} m domain · {GRID_RES}×{GRID_RES} grid
          </p>
        </div>
      </div>
    </div>
  );
};
