import { useEffect, useRef, useState } from 'react';
import { SimulationParams, TrajectoryPoint } from '../types';
import { runNumericalSimulation } from '../utils/simulationEngine';

/**
 * Owns the shared state behind a lesson's Python lab: parameters, the computed
 * trajectory, playback position, and the Pyodide runtime.
 *
 * Pass a module-level constant as `initialParams` so its identity is stable
 * across renders — the reset helper restores exactly that object.
 */
export function useFallingLab(initialParams: SimulationParams) {
  const defaultsRef = useRef(initialParams);

  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [codeOverride, setCodeOverride] = useState<string>('');
  const [points, setPoints] = useState<TrajectoryPoint[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pyodideInstanceRef = useRef<any>(null);

  // Load Pyodide (real in-browser Python) in the background
  useEffect(() => {
    async function initPyodideRuntime() {
      try {
        if ((window as any).loadPyodide) {
          const pyodide = await (window as any).loadPyodide();
          pyodideInstanceRef.current = pyodide;
          setIsPyodideReady(true);
        }
      } catch (e) {
        console.warn('Pyodide runtime background loading deferred to JS solver:', e);
      }
    }
    initPyodideRuntime();
  }, []);

  // Keep the trajectory in sync with slider/parameter changes
  useEffect(() => {
    const trajectory = runNumericalSimulation(params);
    setPoints(trajectory);
    setCurrentStepIndex(0);
  }, [params]);

  const runSimulation = async (customCode: string) => {
    setErrorMessage('');
    setIsExecuting(true);
    setIsPlaying(false);

    try {
      if (pyodideInstanceRef.current) {
        const pyodide = pyodideInstanceRef.current;
        const runnerScript = `
import json

${customCode}

def __run_sim():
    y = ${params.initialHeight}
    v = ${params.initialVelocity}
    t = 0.0
    dt = ${params.dt}
    mass = ${params.mass}
    g = ${params.gravity}
    pts = []

    steps = 0
    while y > -0.01 and steps < 4000:
        a = acceleration(y, v)
        ek = 0.5 * mass * v * v
        ep = mass * g * max(y, 0)
        pts.append({
            "t": round(t, 4),
            "y": round(max(y, 0), 4),
            "v": round(v, 4),
            "a": round(float(a), 4),
            "ek": round(ek, 2),
            "ep": round(ep, 2),
            "etotal": round(ek + ep, 2)
        })
        if y <= 0 and steps > 0:
            break

        v += a * dt
        y += v * dt
        t += dt
        steps += 1

    return json.dumps(pts)

__run_sim()
`;
        const jsonResult = await pyodide.runPythonAsync(runnerScript);
        const parsedPoints = JSON.parse(jsonResult);
        setPoints(parsedPoints);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      } else {
        const trajectory = runNumericalSimulation(params);
        setPoints(trajectory);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
      const trajectory = runNumericalSimulation(params);
      setPoints(trajectory);
    } finally {
      setIsExecuting(false);
    }
  };

  const resetParams = () => {
    setParams(defaultsRef.current);
    setCodeOverride('');
  };

  return {
    params,
    setParams,
    codeOverride,
    setCodeOverride,
    points,
    currentStepIndex,
    setCurrentStepIndex,
    isPlaying,
    setIsPlaying,
    isPyodideReady,
    isExecuting,
    errorMessage,
    runSimulation,
    resetParams,
  };
}
