import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { ProjectileCanvas } from './ProjectileCanvas';

interface LabPoint {
  t: number;
  x: number;
  y: number;
}

const M0 = 50000; // initial mass, kg
const MF = 10000; // dry mass after burnout, kg
const BURN_TIME = 100;
const DT = 0.1;
// Realistic exhaust velocities give burnout speeds of several km/s, so the
// coast-up-and-fall-back-down phase alone can take over half an hour of
// simulated time (more on Mars, where gravity does less to slow it back
// down) — this budget is sized for that, not just the short burn phase.
const MAX_STEPS = 60000;
const BURN_RATE = (M0 - MF) / BURN_TIME; // kg/s

const DEFAULT_CODE = `# Rocket acceleration in two dimensions.
# t = time since launch (s), m = current mass (kg) — both supplied by the loop below.
# Return the acceleration components (ax, ay) in m/s^2.

import math

g = 9.81                    # gravity (m/s^2)
ve = 3000.0                 # exhaust velocity (m/s)
burn_time = ${BURN_TIME}.0  # seconds of powered flight
burn_rate = ${BURN_RATE}    # fuel burned per second, kg/s — (m0 - mf) / burn_time
angle_deg = 0.0             # 0 = straight up; try 45 for a gravity turn

def acceleration(t, m, vx, vy):
    if t < burn_time:
        thrust = ve * burn_rate
        rad = math.radians(angle_deg)
        ax = (thrust / m) * math.sin(rad)
        ay = (thrust / m) * math.cos(rad) - g
    else:
        ax, ay = 0.0, -g
    return (ax, ay)
`;

export const RocketPythonLab: React.FC = () => {
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
        console.warn('Pyodide unavailable; the rocket lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (points.length === 0) return;
    const perFrame = Math.max(1, Math.round(points.length / 200));
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

    // RK4 on the coupled system. Mass follows a fixed burn schedule; the
    // learner's acceleration() only controls how the rocket responds to it.
    const runner = `
import json

${code}

def __run_rocket():
    x, y = 0.0, 0.0
    vx, vy = 0.0, 0.0
    t, dt = 0.0, ${DT}
    m0, mf, burn_t = ${M0}, ${MF}, ${BURN_TIME}
    burn_rate = (m0 - mf) / burn_t
    pts = []

    def mass_at(tt):
        if tt >= burn_t:
            return mf
        return m0 - burn_rate * tt

    def deriv(tt, x, y, vx, vy):
        m = mass_at(tt)
        ax, ay = acceleration(tt, m, vx, vy)
        return vx, vy, float(ax), float(ay)

    for _ in range(${MAX_STEPS}):
        pts.append({"t": round(t, 4), "x": round(x, 4), "y": round(max(y, 0), 4)})
        if t >= burn_t and y <= 0 and t > 0:
            break

        k1 = deriv(t, x, y, vx, vy)
        k2 = deriv(t + 0.5*dt, x + 0.5*dt*k1[0], y + 0.5*dt*k1[1], vx + 0.5*dt*k1[2], vy + 0.5*dt*k1[3])
        k3 = deriv(t + 0.5*dt, x + 0.5*dt*k2[0], y + 0.5*dt*k2[1], vx + 0.5*dt*k2[2], vy + 0.5*dt*k2[3])
        k4 = deriv(t + dt, x + dt*k3[0], y + dt*k3[1], vx + dt*k3[2], vy + dt*k3[3])

        x  += (dt/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
        y  += (dt/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
        vx += (dt/6)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])
        vy += (dt/6)*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3])
        t += dt

    return json.dumps(pts)

__run_rocket()
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
          <span>Python lab — thrust with shrinking mass</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        Lesson 2's lab took <code className="font-mono text-xs">acceleration(x, y, vx, vy)</code>.
        This one also hands you <code className="font-mono text-xs">t</code> (time since launch)
        and <code className="font-mono text-xs">m</code> (current mass) — because unlike a thrown
        ball, a rocket's own mass is part of the physics. The launch itself is fixed at m₀ ={' '}
        {M0.toLocaleString()} kg, m_f = {MF.toLocaleString()} kg over {BURN_TIME} s.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={16}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Rocket acceleration function"
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
            m₀ = {M0.toLocaleString()} kg · m_f = {MF.toLocaleString()} kg · burn = {BURN_TIME} s ·
            Δt = {DT} s
          </p>
        </div>
      </div>
    </div>
  );
};
