import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { DoublePendulumCanvas } from './DoublePendulumCanvas';

interface LabPoint {
  t: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const THETA1_0_DEG = 120;
const THETA2_0_DEG = -10;
const DT = 0.01;
const DURATION_S = 15;
const STEPS = Math.round(DURATION_S / DT);

const DEFAULT_CODE = `# Double pendulum: two coupled, nonlinear equations of motion.
# theta1, theta2 = angles from vertical (rad); omega1, omega2 = angular velocities (rad/s)
# Return the angular accelerations (alpha1, alpha2) in rad/s^2.

import math

g = 9.81
L1, L2 = 1.0, 1.0    # arm lengths (m) — try making these different
m1, m2 = 1.0, 1.0    # bob masses (kg) — try making m2 much lighter than m1

def angular_acceleration(theta1, theta2, omega1, omega2):
    delta = theta1 - theta2
    denom = 2*m1 + m2 - m2*math.cos(2*delta)

    num1 = (-g*(2*m1 + m2)*math.sin(theta1)
            - m2*g*math.sin(theta1 - 2*theta2)
            - 2*math.sin(delta)*m2*(omega2**2*L2 + omega1**2*L1*math.cos(delta)))
    alpha1 = num1 / (L1*denom)

    num2 = (2*math.sin(delta)*(omega1**2*L1*(m1+m2)
            + g*(m1+m2)*math.cos(theta1)
            + omega2**2*L2*m2*math.cos(delta)))
    alpha2 = num2 / (L2*denom)

    return (alpha1, alpha2)
`;

export const DoublePendulumPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [points, setPoints] = useState<LabPoint[]>([]);
  const [maxReach, setMaxReach] = useState(2);
  const [stepIndex, setStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
        console.warn('Pyodide unavailable; the double pendulum lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || points.length === 0) return;
    const perFrame = Math.max(1, Math.round(points.length / 600));
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= points.length ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, points]);

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
import json, math

${code}

def __run_pendulum():
    theta1, theta2 = math.radians(${THETA1_0_DEG}), math.radians(${THETA2_0_DEG})
    omega1, omega2 = 0.0, 0.0
    t, dt = 0.0, ${DT}
    pts = []

    def deriv(theta1, theta2, omega1, omega2):
        a1, a2 = angular_acceleration(theta1, theta2, omega1, omega2)
        return omega1, omega2, float(a1), float(a2)

    def pos(theta1, theta2):
        x1 = L1 * math.sin(theta1)
        y1 = -L1 * math.cos(theta1)
        x2 = x1 + L2 * math.sin(theta2)
        y2 = y1 - L2 * math.cos(theta2)
        return x1, y1, x2, y2

    for _ in range(${STEPS}):
        x1, y1, x2, y2 = pos(theta1, theta2)
        pts.append({"t": round(t, 4), "x1": round(x1, 4), "y1": round(y1, 4), "x2": round(x2, 4), "y2": round(y2, 4)})

        k1 = deriv(theta1, theta2, omega1, omega2)
        k2 = deriv(theta1 + 0.5*dt*k1[0], theta2 + 0.5*dt*k1[1], omega1 + 0.5*dt*k1[2], omega2 + 0.5*dt*k1[3])
        k3 = deriv(theta1 + 0.5*dt*k2[0], theta2 + 0.5*dt*k2[1], omega1 + 0.5*dt*k2[2], omega2 + 0.5*dt*k2[3])
        k4 = deriv(theta1 + dt*k3[0], theta2 + dt*k3[1], omega1 + dt*k3[2], omega2 + dt*k3[3])

        theta1 += (dt/6)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
        theta2 += (dt/6)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
        omega1 += (dt/6)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])
        omega2 += (dt/6)*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3])
        t += dt

    return json.dumps({"pts": pts, "maxReach": L1 + L2})

__run_pendulum()
`;

    try {
      const json = await py.runPythonAsync(runner);
      const parsed = JSON.parse(json);
      if (parsed.pts.length === 0) throw new Error('The simulation produced no points.');
      setPoints(parsed.pts);
      setMaxReach(parsed.maxReach);
      setStepIndex(0);
      setIsPlaying(true);
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
          <span>Python lab — two coupled angles</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        Every lab before this one took a state and returned an acceleration. This one is the same
        shape — <code className="font-mono text-xs">angular_acceleration(theta1, theta2, omega1, omega2)</code>{' '}
        in, <code className="font-mono text-xs">(alpha1, alpha2)</code> out — but now both outputs
        depend on both inputs at once. Try changing L1/L2 or m1/m2 at the top for challenges 4 and
        5; the release angles are fixed at θ₁ = {THETA1_0_DEG}°, θ₂ = {THETA2_0_DEG}°.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={17}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Double pendulum angular acceleration function"
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
            <DoublePendulumCanvas
              points={points}
              maxReach={maxReach}
              stepIndex={stepIndex}
              label="Trajectory computed by your Python code"
            />
          ) : (
            <div className="aspect-square rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to watch the trajectory it produces.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            Released from rest: θ₁ = {THETA1_0_DEG}°, θ₂ = {THETA2_0_DEG}° · Δt = {DT} s ·{' '}
            {DURATION_S} s simulated
          </p>
        </div>
      </div>
    </div>
  );
};
