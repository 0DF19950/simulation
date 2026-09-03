import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { WaveFieldCanvas } from './WaveFieldCanvas';
import { computeFieldGrid, twoSourceAmplitude } from '../utils/waveInterferenceEngine';

const DEG = Math.PI / 180;
const WIDTH = 10;
const HEIGHT = 6;
const GRID_RES = 60;
const SOURCE1 = { x: 3.5, y: 3 };
const SOURCE2 = { x: 6.5, y: 3 };
const AMPLITUDE = 0.02;
const FREQUENCY = 0.6;
const WAVELENGTH = 2.5;
const SWEEP_DURATION = 8; // seconds to sweep Δφ across a full 0-360° cycle

export const WaveInterferenceInstrumentWidget: React.FC = () => {
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  const deltaPhiDeg = Math.min(t / SWEEP_DURATION, 1) * 360;

  const params = useMemo(
    () => ({
      sources: [
        { x: SOURCE1.x, y: SOURCE1.y, amplitude: AMPLITUDE, frequency: FREQUENCY, wavelength: WAVELENGTH, phase: 0 },
        { x: SOURCE2.x, y: SOURCE2.y, amplitude: AMPLITUDE, frequency: FREQUENCY, wavelength: WAVELENGTH, phase: deltaPhiDeg * DEG },
      ],
      reflectors: [],
      width: WIDTH,
      height: HEIGHT,
    }),
    [deltaPhiDeg]
  );

  const grid = useMemo(() => computeFieldGrid(params, t, GRID_RES), [params, t]);
  const analyticAmplitude = twoSourceAmplitude(AMPLITUDE, deltaPhiDeg * DEG);

  useEffect(() => {
    if (!isRunning) {
      lastRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        setT((prev) => {
          const next = prev + dt;
          if (next >= SWEEP_DURATION) {
            setIsRunning(false);
            return SWEEP_DURATION;
          }
          return next;
        });
      }
      lastRef.current = now;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning]);

  const startSimulation = () => {
    if (t >= SWEEP_DURATION) setT(0);
    setIsRunning(true);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setT(0);
  };

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-5 shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Wave Interference — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6 flex justify-center">
          <div className="w-full max-w-[150px]">
            <WaveFieldCanvas
              values={grid.values}
              gridRes={grid.gridRes}
              maxAmplitude={grid.maxAmplitude}
              width={WIDTH}
              height={HEIGHT}
              sources={[SOURCE1, SOURCE2]}
              label="Wave interference instrument preview"
            />
          </div>
        </div>

        <div className="col-span-6 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">t (time):</span>
            <span className="font-bold text-cream">{t.toFixed(1)} s</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">Δφ:</span>
            <span className="font-bold text-gold">{deltaPhiDeg.toFixed(0)}°</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">amplitude:</span>
            <span className="font-bold text-gold">{(analyticAmplitude * 100).toFixed(2)} cm</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">sources:</span>
            <span className="font-bold text-sage-light">2, f = {FREQUENCY} Hz</span>
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
