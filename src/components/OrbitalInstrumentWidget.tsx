import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { OrbitCanvas } from './OrbitCanvas';
import { EARTH, simulateOrbit } from '../utils/orbitalEngine';

const PARAMS = {
  altitudeKm: 400,
  speedFactor: 1,
  gravityScale: 1,
  dtSeconds: 10,
  method: 'rk4' as const,
  moonMassScale: 0,
};

export const OrbitalInstrumentWidget: React.FC = () => {
  const result = useMemo(() => simulateOrbit(PARAMS), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);

  const total = result.points.length;
  const current = result.points[Math.min(stepIndex, total - 1)];

  useEffect(() => {
    if (!isRunning) return;
    const perFrame = Math.max(1, Math.round(total / 360)); // ~6s per orbit at 60fps
    const tick = () => {
      setStepIndex((prev) => {
        const next = prev + perFrame;
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
    setIsRunning(false);
    setStepIndex(0);
  };

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-5 shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Orbital Motion — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6 flex justify-center">
          <div className="w-full max-w-[150px]">
            <OrbitCanvas
              points={result.points}
              maxRadiusM={result.maxRadiusM}
              stepIndex={stepIndex}
              label="Orbital instrument preview"
            />
          </div>
        </div>

        <div className="col-span-6 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">t (time):</span>
            <span className="font-bold text-cream">{((current?.t ?? 0) / 60).toFixed(1)} min</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">altitude:</span>
            <span className="font-bold text-gold">
              {(((current?.r ?? EARTH.radiusM) - EARTH.radiusM) / 1000).toFixed(0)} km
            </span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">speed:</span>
            <span className="font-bold text-cream">{(((current?.speed ?? 0)) / 1000).toFixed(2)} km/s</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">period:</span>
            <span className="font-bold text-sage-light">{result.periodMinutes?.toFixed(0) ?? '—'} min</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sage/30">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded font-mono text-xs font-bold transition-all ${
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
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 font-mono text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
