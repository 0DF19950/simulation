import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { ProjectileCanvas } from './ProjectileCanvas';

interface LabPoint {
  t: number;
  x: number;
  y: number;
}

const DEFAULT_CODE = `# Projectile acceleration in two dimensions.
# Return the acceleration components (ax, ay) in m/s^2.

g = 9.81        # gravity (m/s^2)
drag = 0.00     # air drag coefficient (try 0.02, then 0.08)

def acceleration(x, y, vx, vy):
    speed = (vx*vx + vy*vy) ** 0.5
    ax = -drag * speed * vx
    ay = -g - drag * speed * vy
    return (ax, ay)
`;

const V0 = 25; // launch speed, m/s
const ANGLE_DEG = 40;
const DT = 0.02;
const MAX_STEPS = 3000;

export const ProjectilePythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [points, setPoints] = useState<LabPoint[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [ranWith, setRanWith] = useState<'python' | null>(null);

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
        console.warn('Pyodide unavailable; the projectile lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate whatever trajectory is currently loaded.
  useEffect(() => {
    if (points.length === 0) return;
    const perFrame = Math.max(1, Math.round(points.length / 180));
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= points.length ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [points]);

  const run = async () => {
    setError('');
    setIsRunning(true);

    const py = pyodideRef.current;
    if (!py) {
      setError('Python is still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    const rad = (ANGLE_DEG * Math.PI) / 180;
    const vx0 = V0 * Math.cos(rad);
    const vy0 = V0 * Math.sin(rad);

    // RK4 on the coupled system, calling the learner's acceleration() each stage.
    const runner = `
import json

${code}

def __run_projectile():
    x, y = 0.0, 0.0
    vx, vy = ${vx0}, ${vy0}
    t, dt = 0.0, ${DT}
    pts = []

    def deriv(x, y, vx, vy):
        ax, ay = acceleration(x, y, vx, vy)
        return vx, vy, float(ax), float(ay)

    for _ in range(${MAX_STEPS}):
        pts.append({"t": round(t, 4), "x": round(x, 4), "y": round(max(y, 0), 4)})
        if y <= 0 and t > 0:
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

__run_projectile()
`;

    try {
      const json = await py.runPythonAsync(runner);
      const parsed: LabPoint[] = JSON.parse(json);
      if (parsed.length === 0) throw new Error('The simulation produced no points.');
      setPoints(parsed);
      setStepIndex(0);
      setRanWith('python');
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  const maxRange = points.length ? Math.max(...points.map((p) => p.x), 1) : 1;
  const maxHeight = points.length ? Math.max(...points.map((p) => p.y), 1) : 1;

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
        Lesson 1's lab took <code className="font-mono text-xs">acceleration(y, v)</code> and
        returned one number. A launched object needs two, because gravity and drag can point in
        different directions than the object is moving. Edit the function and run it — the launch
        itself is fixed at {V0} m/s, {ANGLE_DEG}°, so every change you see comes from the physics
        you wrote.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={12}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Projectile acceleration function"
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
                {points.length} steps · real Python
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
            <ProjectileCanvas
              points={points}
              maxRange={maxRange}
              maxHeight={maxHeight}
              stepIndex={stepIndex}
              label="Trajectory computed by your Python code"
            />
          ) : (
            <div className="aspect-[16/9] rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to plot the trajectory it produces.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            Launch: {V0} m/s at {ANGLE_DEG}° · Δt = {DT} s · {MAX_STEPS} steps max
          </p>
        </div>
      </div>
    </div>
  );
};
