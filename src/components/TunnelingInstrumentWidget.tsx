import React, { useMemo } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { TunnelingCanvas } from './TunnelingCanvas';
import { usePlayback } from '../hooks/usePlayback';
import { makeGrid, packetTransmission, potentialOn, runPacket, transmissionRect } from '../utils/tunnelingEngine';

// An electron at 0.5 eV meets a barrier 1 eV high and 0.5 nm wide: about one
// packet in ten gets through.
const ENERGY = 0.5; // eV
const HEIGHT = 1; // eV
const THICKNESS = 0.5; // nm
const PLAY_SECONDS = 8;
// Gold stepped for the dark panel: validated inside the dark lightness band and >= 3:1 on it.
const WAVE = '#B8852F';

export const TunnelingInstrumentWidget: React.FC = () => {
  const sim = useMemo(() => {
    const grid = makeGrid(512, 0.1);
    const potential = potentialOn(grid, [{ start: 0, width: THICKNESS, height: HEIGHT }]);
    const run = runPacket({ grid, potential, energy: ENERGY, width: 1.5, start: -10, dt: 0.02, duration: 70, frames: 200 });
    let startPeak = 0;
    for (let i = 0; i < grid.n; i++) startPeak = Math.max(startPeak, run.density[i]);
    const exact = packetTransmission(ENERGY, 1.5, (E) => transmissionRect(E, HEIGHT, THICKNESS));
    return { grid, potential, run, exact, peak: Math.min(run.peak, 2.2 * startPeak) };
  }, []);
  const play = usePlayback(PLAY_SECONDS, sim, false);
  const { grid, run } = sim;
  const frame = Math.min(run.nFrames - 1, Math.round((play.t / PLAY_SECONDS) * (run.nFrames - 1)));
  const density = run.density.subarray(frame * grid.n, (frame + 1) * grid.n);

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-6 shadow-2xl relative h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">Quantum Tunneling — Instrument View</span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">LIVE TELEMETRY</span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <TunnelingCanvas
          x={grid.x}
          potential={sim.potential}
          traces={[{ density, color: WAVE }]}
          energy={ENERGY}
          peak={sim.peak}
          view={[-15, 15]}
          energyMax={1.3}
          label="An electron wave packet meeting a barrier taller than its energy; part of it gets through"
        />

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t, fs</div>
            <div className="text-sm font-bold text-cream">{run.times[frame].toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">left side</div>
            <div className="text-sm font-bold text-gold">{(100 * run.left[frame]).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">right side</div>
            <div className="text-sm font-bold text-gold">{(100 * run.right[frame]).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">formula</div>
            <div className="text-sm font-bold text-sage-light">{(100 * sim.exact).toFixed(1)}%</div>
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
