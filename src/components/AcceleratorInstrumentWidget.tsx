import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { AcceleratorCanvas } from './AcceleratorCanvas';
import { AcceleratorParams, runAccelerator } from '../utils/acceleratorEngine';

// A cyclotron: one proton, a uniform field, and an RF gap timed to its orbit.
// It speeds up and spirals outward, yet the time per lap never changes — the
// Part 3 result that lets a fixed RF frequency keep pushing it at all.
const PARAMS: AcceleratorParams = {
  species: 'proton',
  B: 0.5,
  speed: 3e6,
  arrangement: 'single',
  macroWeight: 1,
  spaceCharge: false,
  rfVoltage: 2000,
  radiationLossPerLap: 0,
  pusher: 'boris',
  laps: 8,
  stepsPerLap: 180,
};
const PLAY_DURATION = 8; // seconds of wall-clock time for the whole run

export const AcceleratorInstrumentWidget: React.FC = () => {
  const run = useMemo(() => runAccelerator(PARAMS), []);
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  const frame = Math.round((Math.min(t, PLAY_DURATION) / PLAY_DURATION) * (run.nFrames - 1));
  const simTime = frame * run.frameDt;
  const k = frame * run.nParticles * 2;
  const radius = Math.hypot(run.positions[k], run.positions[k + 1]);
  const lapsDone = Math.min(run.lapPeriods.length, Math.floor(simTime / run.formulaPeriod));
  const lapTime = lapsDone > 0 ? run.lapPeriods[lapsDone - 1] : run.formulaPeriod;

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
          if (next >= PLAY_DURATION) {
            setIsRunning(false);
            return PLAY_DURATION;
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
    if (t >= PLAY_DURATION) setT(0);
    setIsRunning(true);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setT(0);
  };

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-6 shadow-2xl relative h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Particle Accelerator — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="w-full max-w-[270px] mx-auto">
          <AcceleratorCanvas
            run={run}
            frame={frame}
            showGap
            formulaRadius={run.formulaRadius}
            label="Cyclotron instrument preview"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t, ns</div>
            <div className="text-sm font-bold text-cream">{(simTime * 1e9).toFixed(0)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">speed, 10⁶ m/s</div>
            <div className="text-sm font-bold text-gold">{(run.speed0[frame] / 1e6).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">radius, cm</div>
            <div className="text-sm font-bold text-gold">{(radius * 100).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">time/lap, ns</div>
            <div className="text-sm font-bold text-sage-light">{(lapTime * 1e9).toFixed(1)}</div>
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
