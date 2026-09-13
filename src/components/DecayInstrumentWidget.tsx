import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { DecayJar } from './DecayJar';
import { runDecay } from '../utils/decayEngine';

// A jar of 400 atoms with a 10-day half-life: every dot on its own random clock,
// counted against the exact formula as they go.
const HALF_LIFE = 10; // days
const ATOMS = 400;
const DURATION = 50; // days
const STEPS = 200;
const PLAY_SECONDS = 8;
// Gold stepped for the dark panel: validated inside the dark lightness band and >= 3:1 on it.
const ATOM = '#B8852F';
const EMPTY = 'rgba(166, 205, 198, 0.16)';

export const DecayInstrumentWidget: React.FC = () => {
  const run = useMemo(
    () => runDecay({ chains: [{ halfLives: [HALF_LIFE], initialAtoms: ATOMS }], duration: DURATION, steps: STEPS, rule: 'exact', seed: 3, jarSize: ATOMS }),
    []
  );
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  const frame = Math.round((Math.min(t, PLAY_SECONDS) / PLAY_SECONDS) * STEPS);
  const days = run.times[frame];
  const left = run.simulated[0][frame];
  const formula = ATOMS * 2 ** (-days / HALF_LIFE);

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
          if (next >= PLAY_SECONDS) {
            setIsRunning(false);
            return PLAY_SECONDS;
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
    if (t >= PLAY_SECONDS) setT(0);
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
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">Radioactive Decay — Instrument View</span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">LIVE TELEMETRY</span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="w-full max-w-[270px] mx-auto">
          <DecayJar
            jar={run.jar}
            jarAtoms={run.jarAtoms}
            frame={frame}
            memberColors={[ATOM, null]}
            surface="#0E2B34"
            emptyColor={EMPTY}
            label="A jar of 400 radioactive atoms decaying"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t, days</div>
            <div className="text-sm font-bold text-cream">{days.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">atoms left</div>
            <div className="text-sm font-bold text-gold">{left}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">formula</div>
            <div className="text-sm font-bold text-gold">{Math.round(formula)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">half-lives</div>
            <div className="text-sm font-bold text-sage-light">{(days / HALF_LIFE).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-sage/30">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-mono text-xs font-bold transition-all ${
            isRunning ? 'bg-deepteal-dark text-sage/50 cursor-not-allowed' : 'bg-gold hover:bg-gold-hover text-deepteal shadow-sm'
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
