import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { ElectricFieldCanvas } from './ElectricFieldCanvas';
import {
  ElectricFieldParams,
  computeFieldGrid,
  fieldAt,
  formatField,
  magnitudeOf,
  referenceField,
  traceFieldLines,
} from '../utils/electricFieldEngine';

const SIZE = 0.12; // m, square domain
const MID = { x: 0.06, y: 0.06 };
const SEPARATION = 0.04; // m
const PROBE = { x: 0.06, y: 0.09 }; // 3 cm out along the bisector
const Q = 2e-6; // C
const GRID_RES = 60;
const SWEEP_DURATION = 8; // seconds to swing q₂ from +Q, through zero, to −Q

export const ElectricFieldInstrumentWidget: React.FC = () => {
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  // q₂ swings from an identical pair to an opposite pair — the two cases the
  // opening questions ask about. Snap the crossing to exactly zero so no
  // vanishingly small charge sprouts field lines.
  const q2Raw = Q * Math.cos((Math.PI * Math.min(t, SWEEP_DURATION)) / SWEEP_DURATION);
  const q2 = Math.abs(q2Raw) < Q * 1e-3 ? 0 : q2Raw;

  const params: ElectricFieldParams = useMemo(
    () => ({
      charges: [
        { x: MID.x - SEPARATION / 2, y: MID.y, q: Q },
        { x: MID.x + SEPARATION / 2, y: MID.y, q: q2 },
      ],
      plate: null,
      width: SIZE,
      height: SIZE,
    }),
    [q2]
  );

  const grid = useMemo(() => computeFieldGrid(params, GRID_RES), [params]);
  const lines = useMemo(() => traceFieldLines(params, 12), [params]);
  const probeField = useMemo(() => fieldAt(params, PROBE.x, PROBE.y), [params]);
  const reference = referenceField(params);
  const midField = magnitudeOf(fieldAt(params, MID.x, MID.y));

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
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-6 shadow-2xl relative h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Electromagnetic Fields — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="w-full max-w-[270px] mx-auto">
          <ElectricFieldCanvas
            magnitude={grid.magnitude}
            gridRes={grid.gridRes}
            referenceField={reference}
            width={SIZE}
            height={SIZE}
            charges={params.charges}
            fieldLines={lines}
            probe={PROBE}
            probeField={probeField}
            label="Electric field instrument preview"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">t (time)</div>
            <div className="text-sm font-bold text-cream">{t.toFixed(1)} s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">q₂</div>
            <div className="text-sm font-bold text-gold">{(q2 * 1e6).toFixed(2)} μC</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">|E| mid, N/C</div>
            <div className="text-sm font-bold text-gold">{formatField(midField, reference * 1e-9)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-sage-light mb-1">|E| at P, N/C</div>
            <div className="text-sm font-bold text-sage-light">
              {formatField(magnitudeOf(probeField), reference * 1e-9)}
            </div>
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
