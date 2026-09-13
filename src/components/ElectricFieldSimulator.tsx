import React, { useMemo, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { ElectricFieldCanvas } from './ElectricFieldCanvas';
import {
  ElectricFieldParams,
  PointCharge,
  bisectorFieldExact,
  computeFieldGrid,
  fieldAt,
  formatField,
  magnitudeOf,
  referenceField,
  traceFieldLines,
} from '../utils/electricFieldEngine';

const SIZE = 0.12; // m, square domain
const MID = { x: 0.06, y: 0.06 };
const PLATE_Y = 0.02; // m — 4 cm below the line of charges
const THIRD = { x: 0.09, y: 0.035 }; // off-axis, so it breaks the symmetry
const UNEQUAL_FACTOR = 1.25;
const GRID_RES = 110;

export const ElectricFieldSimulator: React.FC = () => {
  const [qMicro, setQMicro] = useState(2); // μC
  const [dCm, setDCm] = useState(4);
  const [lCm, setLCm] = useState(3);
  const [flip, setFlip] = useState(false);
  const [third, setThird] = useState(false);
  const [plate, setPlate] = useState(false);
  const [unequal, setUnequal] = useState(false);

  const q = qMicro * 1e-6;
  const d = dCm / 100;
  const L = lCm / 100;

  const params: ElectricFieldParams = useMemo(() => {
    const q2 = (flip ? -1 : 1) * (unequal ? UNEQUAL_FACTOR : 1) * q;
    const charges: PointCharge[] = [
      { x: MID.x - d / 2, y: MID.y, q },
      { x: MID.x + d / 2, y: MID.y, q: q2 },
    ];
    if (third) charges.push({ x: THIRD.x, y: THIRD.y, q });
    return { charges, plate: plate ? { y: PLATE_Y } : null, width: SIZE, height: SIZE };
  }, [q, d, flip, unequal, third, plate]);

  const probe = useMemo(() => ({ x: MID.x, y: MID.y + L }), [L]);
  const grid = useMemo(() => computeFieldGrid(params, GRID_RES), [params]);
  const lines = useMemo(() => traceFieldLines(params), [params]);
  const probeField = useMemo(() => fieldAt(params, probe.x, probe.y), [params, probe]);

  const reference = referenceField(params);
  const zero = reference * 1e-9;
  const measured = magnitudeOf(probeField);
  const exact = bisectorFieldExact(q, d, L);
  const midField = magnitudeOf(fieldAt(params, MID.x, MID.y));
  const directionDeg = measured > zero ? (Math.atan2(probeField.ey, probeField.ex) * 180) / Math.PI : null;

  const isClean = !flip && !third && !plate && !unequal;
  const gap = exact > zero ? Math.abs(measured - exact) / exact : measured > zero ? Infinity : 0;

  const brokenBy = plate
    ? 'The grounded plate is in.'
    : third
    ? 'A third charge is in.'
    : flip
    ? 'One charge is now negative.'
    : 'The charges are no longer equal.';

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Zap className="w-5 h-5 text-gold-hover" />
        <span>Electric field simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Every pixel is a full vector sum of every charge's field — brighter means stronger, on a
        log scale, and the lines follow the field's direction. The red ring is point P from Part 3,
        on the bisector, with an arrow showing which way the field points there.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <ElectricFieldCanvas
            magnitude={grid.magnitude}
            gridRes={grid.gridRes}
            referenceField={reference}
            width={SIZE}
            height={SIZE}
            charges={params.charges}
            fieldLines={lines}
            plateY={plate ? PLATE_Y : null}
            probe={probe}
            probeField={probeField}
          />
          <p className="font-mono text-[10px] text-deepteal-soft mt-2">
            12 × 12 cm region · gold = positive, sage = negative · {GRID_RES}×{GRID_RES} grid
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Charge Q</span>
              <span className="text-deepteal font-bold">{qMicro.toFixed(1)} μC</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={qMicro}
              onChange={(e) => setQMicro(parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Charge"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Separation d</span>
                <span className="text-deepteal font-bold">{dCm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={dCm}
                onChange={(e) => setDCm(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Separation"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Distance L</span>
                <span className="text-deepteal font-bold">{lCm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={lCm}
                onChange={(e) => setLCm(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Distance from midpoint to P"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} className="accent-gold" />
              Flip q₂ negative
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={third} onChange={(e) => setThird(e.target.checked)} className="accent-gold" />
              3rd charge
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={plate} onChange={(e) => setPlate(e.target.checked)} className="accent-gold" />
              Grounded plate
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={unequal} onChange={(e) => setUnequal(e.target.checked)} className="accent-gold" />
              q₂ = {UNEQUAL_FACTOR}Q
            </label>
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">Part 3 formula at P</dt>
            <dd className="text-deepteal text-right font-bold">{formatField(exact, zero)} N/C</dd>
            <dt className="text-deepteal-soft">Vector sum at P</dt>
            <dd className="text-deepteal text-right font-bold">{formatField(measured, zero)} N/C</dd>
            <dt className="text-deepteal-soft">Direction at P</dt>
            <dd className="text-deepteal text-right font-bold">
              {directionDeg === null ? '—' : `${directionDeg.toFixed(0)}° from +x`}
            </dd>
            <dt className="text-deepteal-soft">|E| at the midpoint</dt>
            <dd className="text-deepteal text-right font-bold">{formatField(midField, zero)} N/C</dd>
          </dl>

          {isClean ? (
            <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
              <span>
                Two identical charges, no plate — adding the two field vectors at P gives the same
                answer as Part 3's closed form
                {gap < 1e-9 ? ', to floating-point precision' : `, within ${(gap * 100).toFixed(3)}%`}.
                Flip a sign, add a charge or the plate, or make them unequal to see where it stops
                applying.
              </span>
            </p>
          ) : (
            <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
              <span className="font-bold">{brokenBy}</span> The two-charge formula no longer
              describes P: it still predicts {formatField(exact, zero)} N/C, but adding every field
              vector gives {formatField(measured, zero)} N/C. That number came from superposition,
              not algebra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
