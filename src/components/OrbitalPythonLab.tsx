import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { OrbitCanvas } from './OrbitCanvas';
import { EARTH, OrbitPoint, simulateOrbit } from '../utils/orbitalEngine';

const DEFAULT_CODE = `# Orbital acceleration in two dimensions.
# Return the acceleration components (ax, ay) in m/s^2.

GM = 3.986004418e14      # Earth's gravitational parameter, m^3/s^2

def acceleration(x, y, vx, vy):
    r = (x*x + y*y) ** 0.5
    ax = -GM * x / r**3
    ay = -GM * y / r**3
    return (ax, ay)
`;

const ALT_KM = 400;
const STEPS = 1200;
const DT = 10;

export const OrbitalPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [points, setPoints] = useState<OrbitPoint[]>([]);
  const [maxRadiusM, setMaxRadiusM] = useState(EARTH.radiusM * 2);
  const [stepIndex, setStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [ranWith, setRanWith] = useState<'python' | 'javascript' | null>(null);

  const pyodideRef = useRef<any>(null);
  const frameRef = useRef<number>(0);

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
        console.warn('Pyodide unavailable; the orbital lab will use the JS engine:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate whatever trajectory is currently loaded.
  useEffect(() => {
    if (points.length === 0) return;
    const perFrame = Math.max(1, Math.round(points.length / 360));
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= points.length ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [points]);

  const loadFallback = () => {
    const result = simulateOrbit({
      altitudeKm: ALT_KM,
      speedFactor: 1,
      gravityScale: 1,
      dtSeconds: DT,
      method: 'rk4',
      moonMassScale: 0,
    });
    setPoints(result.points);
    setMaxRadiusM(result.maxRadiusM);
    setStepIndex(0);
    setRanWith('javascript');
  };

  const run = async () => {
    setError('');
    setIsRunning(true);

    const py = pyodideRef.current;
    if (!py) {
      loadFallback();
      setIsRunning(false);
      return;
    }

    const r0 = EARTH.radiusM + ALT_KM * 1000;
    const v0 = Math.sqrt(EARTH.mu / r0);

    // RK4 on the coupled system, calling the learner's acceleration() each stage.
    const runner = `
import json

${code}

def __run_orbit():
    x, y = ${r0}, 0.0
    vx, vy = 0.0, ${v0}
    t, dt = 0.0, ${DT}
    pts = []

    def deriv(x, y, vx, vy):
        ax, ay = acceleration(x, y, vx, vy)
        return vx, vy, float(ax), float(ay)

    for _ in range(${STEPS}):
        r = (x*x + y*y) ** 0.5
        pts.append({"t": t, "x": x, "y": y, "vx": vx, "vy": vy,
                    "r": r, "speed": (vx*vx + vy*vy) ** 0.5})
        if r < ${EARTH.radiusM}:
            break

        k1 = deriv(x, y, vx, vy)
        k2 = deriv(x + 0.5*dt*k1[0], y + 0.5*dt*k1[1], vx + 0.5*dt*k1[2], vy + 0.5*dt*k1[3])
        k3 = deriv(x + 0.5*dt*k2[0], y + 0.5*dt*k2[1], vx + 0.5*dt*k2[2], vy + 0.5*dt*k2[3])
        k4 = deriv(x + dt*k3[0], y + dt*k3[1], vx + dt*k3[2], vy + dt*k3[3])

        x  += (dt/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
        y  += (dt/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
        vx += (dt/6)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])
        vy += (dt/6)*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3])
        t += dt

    return json.dumps(pts)

__run_orbit()
`;

    try {
      const json = await py.runPythonAsync(runner);
      const parsed: OrbitPoint[] = JSON.parse(json);
      if (parsed.length === 0) throw new Error('The simulation produced no points.');
      setPoints(parsed);
      setMaxRadiusM(Math.max(...parsed.map((p) => p.r)));
      setStepIndex(0);
      setRanWith('python');
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
          <span>Python lab — two dimensions</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        The falling-body lab took <code className="font-mono text-xs">acceleration(y, v)</code> and
        returned one number. An orbit needs two, because gravity and velocity point in different
        directions. Edit the function and run it — the integrator is the RK4 from Part 6, calling
        your code at every stage.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={14}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Orbital acceleration function"
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
            {ranWith && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {points.length} steps · {ranWith === 'python' ? 'real Python' : 'JS fallback'}
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
          {points.length > 0 ? (
            <OrbitCanvas
              points={points}
              maxRadiusM={maxRadiusM}
              stepIndex={stepIndex}
              label="Orbit computed by your Python code"
            />
          ) : (
            <div className="aspect-square rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to plot the orbit it produces.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            Start: {ALT_KM} km altitude, circular speed · Δt = {DT} s · {STEPS} steps max
          </p>
        </div>
      </div>
    </div>
  );
};
