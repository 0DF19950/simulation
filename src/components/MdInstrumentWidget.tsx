import React, { useMemo } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { MdCanvas } from './MdCanvas';
import { usePlayback } from '../hooks/usePlayback';
import { ARGON, bondsIntact, clusterAtoms, clusterBox, runMd, temperatureSeries } from '../utils/mdEngine';

// 37 argon atoms started at 100 K: bonds stretch, break and re-form, while the
// total energy holds still.
const ATOMS = 37;
const START_K = 100;
const DURATION = 60; // ps
const PLAY_SECONDS = 10;
// Gold stepped for the dark panel: validated inside the dark lightness band and >= 3:1 on it.
const ATOM = '#B8852F';

export const MdInstrumentWidget: React.FC = () => {
  const sim = useMemo(() => {
    const box = clusterBox(ATOMS, ARGON.sigma);
    const run = runMd({
      atoms: clusterAtoms(ATOMS, ARGON.sigma, ARGON.massU, START_K, 3),
      epsilon: ARGON.epsilon,
      sigma: ARGON.sigma,
      massU: ARGON.massU,
      dt: 0.01,
      steps: DURATION * 100,
      integrator: 'verlet',
      box,
      maxFrames: 600,
    });
    return { box, run, bonds: bondsIntact(run, ARGON.sigma), temps: temperatureSeries(run) };
  }, []);
  const play = usePlayback(PLAY_SECONDS, sim, false);
  const { run } = sim;
  const frame = Math.min(run.nFrames - 1, Math.round((play.t / PLAY_SECONDS) * (run.nFrames - 1)));

  // One frame of 37 atoms is a jumpy thermometer, so average the last 2 ps.
  let sum = 0;
  let count = 0;
  for (let f = Math.max(0, frame - 20); f <= frame; f++) {
    sum += sim.temps[f];
    count++;
  }

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-6 shadow-2xl relative h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">Molecular Dynamics — Instrument View</span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">LIVE TELEMETRY</span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="w-full max-w-[270px] mx-auto">
          <MdCanvas
            positions={run.positions}
            n={run.n}
            frame={frame}
            sigma={ARGON.sigma}
            view={{ cx: sim.box / 2, cy: sim.box / 2, half: sim.box * 0.52 }}
            colors={[ATOM]}
            box={sim.box}
            bondLength={1.35 * ARGON.sigma}
            label="37 argon atoms jostling in a box, with bonds drawn between near neighbours"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t, ps</div>
            <div className="text-sm font-bold text-cream">{run.times[frame].toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">temp, K</div>
            <div className="text-sm font-bold text-gold">{Math.round(sum / count)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">bonds</div>
            <div className="text-sm font-bold text-gold">{Math.round(sim.bonds[frame] * 100)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">energy, meV</div>
            <div className="text-sm font-bold text-sage-light">{run.total[frame].toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-sage/30">
        <button
          onClick={play.start}
          disabled={play.playing}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-mono text-xs font-bold transition-all ${
            play.playing ? 'bg-deepteal-dark text-sage/50 cursor-not-allowed' : 'bg-gold hover:bg-gold-hover text-deepteal shadow-sm'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{play.playing ? 'Running...' : 'Run Simulation'}</span>
        </button>
        <button
          onClick={play.reset}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 font-mono text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
