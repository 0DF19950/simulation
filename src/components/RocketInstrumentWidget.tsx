import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { ProjectileCanvas } from './ProjectileCanvas';
import { simulateRocket } from '../utils/rocketEngine';

const BURN_TIME = 4;
const PARAMS = {
  m0: 100,
  mf: 20,
  burnTime: BURN_TIME,
  exhaustVelocity: 120,
  gravity: 9.81,
  dragCoefficient: 0,
  gravityTurnDeg: 0,
  turnStartFrac: 0.2,
  dt: 0.02,
  method: 'rk4' as const,
};

export const RocketInstrumentWidget: React.FC = () => {
  // Only the powered ascent plus a moment of coast — the point of this
  // preview is "mass shrinks, acceleration grows," not the full flight
  // back to the ground, which at these speeds takes far longer to watch.
  const points = useMemo(() => {
    const result = simulateRocket(PARAMS);
    return result.points.filter((p) => p.t <= BURN_TIME + 1.5);
  }, []);

  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);

  const total = points.length;
  const current = points[Math.min(stepIndex, total - 1)];
  const maxHeight = Math.max(...points.map((p) => p.y), 1);
  const maxRange = Math.max(...points.map((p) => p.x), 1);

  // Side effects (scheduling the next frame) live in this plain closure, not
  // inside the setStepIndex updater — StrictMode double-invokes updaters in
  // development to catch impurity, which would double-schedule (and then
  // cascade-duplicate) requestAnimationFrame calls if it lived there instead.
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= total - 1) {
          setIsRunning(false);
          return total - 1;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning, total]);

  const startSimulation = () => {
    if (stepIndex >= total - 1) setStepIndex(0);
    setIsRunning(true);
  };

  const resetSimulation = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setIsRunning(false);
    setStepIndex(0);
  };

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-6 shadow-2xl relative h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Rocket Launch — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="w-full max-w-[260px] mx-auto">
          <ProjectileCanvas
            points={points}
            maxRange={maxRange}
            maxHeight={maxHeight}
            stepIndex={stepIndex}
            label="Rocket instrument preview"
            aspectClassName="aspect-[3/5]"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t (time)</div>
            <div className="text-sm font-bold text-cream">{current?.t.toFixed(2)} s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">altitude</div>
            <div className="text-sm font-bold text-gold">{current?.y.toFixed(1)} m</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">speed</div>
            <div className="text-sm font-bold text-cream">{current?.speed.toFixed(1)} m/s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">mass</div>
            <div className="text-sm font-bold text-sage-light">{current?.mass.toFixed(1)} kg</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-sage/30">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-mono text-xs font-bold transition-all ${
            isRunning
              ? 'bg-deepteal-dark text-sage/50 cursor-not-allowed'
              : 'bg-gold hover:bg-gold-hover text-deepteal shadow-sm'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'Running...' : 'Run Simulation'}</span>
        </button>
        <button
          onClick={resetSimulation}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 font-mono text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
