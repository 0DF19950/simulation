import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Magnet, Pause, Play, RotateCcw } from 'lucide-react';
import { AcceleratorCanvas } from './AcceleratorCanvas';
import {
  AcceleratorParams,
  Arrangement,
  BUNCH_SIZE,
  E_CHARGE,
  Pusher,
  SPECIES,
  SpeciesId,
  runAccelerator,
} from '../utils/acceleratorEngine';

const LAPS = 8;
const STEPS_PER_LAP = 180;
const RF_VOLTAGE = 2000; // V
const RADIATION_PER_LAP = 0.06;
const WEIGHTS = [
  { value: 1, label: '1 — real particles' },
  { value: 2.5e7, label: '25 million' },
  { value: 1e8, label: '100 million' },
  { value: 1e9, label: '1 billion' },
];

const SUPERSCRIPTS: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/** "3.0×10¹⁶"-style formatting for the few numbers here that span many decades. */
function sci(value: number, digits = 1): string {
  if (!Number.isFinite(value) || value === 0) return String(value);
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = Number((value / 10 ** exponent).toFixed(digits));
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  if (exponent === 0) return mantissa.toFixed(digits);
  return `${mantissa.toFixed(digits)}×10${String(exponent).split('').map((c) => SUPERSCRIPTS[c]).join('')}`;
}

const pct = (fraction: number, digits = 2) => `${(fraction * 100).toFixed(digits)}%`;

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border transition-colors ${
            value === o.value
              ? 'bg-deepteal border-deepteal text-cream font-bold'
              : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const AcceleratorSimulator: React.FC = () => {
  const [species, setSpecies] = useState<SpeciesId>('proton');
  const [B, setB] = useState(0.5);
  const [speedM, setSpeedM] = useState(3);
  const [arrangement, setArrangement] = useState<Arrangement>('single');
  const [weight, setWeight] = useState(WEIGHTS[1].value);
  const [spaceCharge, setSpaceCharge] = useState(true);
  const [rf, setRf] = useState(false);
  const [radiation, setRadiation] = useState(false);
  const [pusher, setPusher] = useState<Pusher>('boris');
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const rafRef = useRef<number>(0);

  const params: AcceleratorParams = useMemo(
    () => ({
      species,
      B,
      speed: speedM * 1e6,
      arrangement,
      macroWeight: weight,
      spaceCharge,
      rfVoltage: rf ? RF_VOLTAGE : 0,
      radiationLossPerLap: radiation ? RADIATION_PER_LAP : 0,
      pusher,
      laps: LAPS,
      stepsPerLap: STEPS_PER_LAP,
    }),
    [species, B, speedM, arrangement, weight, spaceCharge, rf, radiation, pusher]
  );

  const run = useMemo(() => runAccelerator(params), [params]);

  useEffect(() => setFrame(0), [run]);

  useEffect(() => {
    if (!isPlaying) return;
    const perFrame = Math.max(1, Math.round(run.nFrames / 480)); // about 8 s per run
    const tick = () => {
      setFrame((f) => (f + perFrame >= run.nFrames ? 0 : f + perFrame));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, run]);

  const s = SPECIES[species];
  const particleWord = species === 'proton' ? 'protons' : species === 'deuteron' ? 'deuterons' : 'antiprotons';
  const meanPeriod = run.lapPeriods.length
    ? run.lapPeriods.reduce((a, b) => a + b, 0) / run.lapPeriods.length
    : run.formulaPeriod;
  const radiusGap = Math.abs(run.firstLapRadius - run.formulaRadius) / run.formulaRadius;
  const periodGap = Math.abs(meanPeriod - run.formulaPeriod) / run.formulaPeriod;
  const speedChange = (run.finalSpeed - run.initialSpeed) / run.initialSpeed;
  const interacting = spaceCharge && arrangement !== 'single';
  const integratorDrift = !rf && !radiation && !interacting && Math.abs(speedChange) > 0.01;
  const clean = !rf && !radiation && !interacting && !integratorDrift;
  const gainKeV = (0.5 * s.m * (run.finalSpeed ** 2 - run.initialSpeed ** 2)) / E_CHARGE / 1000;
  const rms = run.bunchRmsByLap;
  const peakRms = rms ? Math.max(...rms) : 0;
  const peakLap = rms ? rms.indexOf(peakRms) : 0;
  const separation = run.pairSeparationByLap;
  const turn = run.pairTurnByLap;
  const firstLapTime = run.lapPeriods[0] ?? run.formulaPeriod;
  const lastLapTime = run.lapPeriods[run.lapPeriods.length - 1] ?? run.formulaPeriod;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Magnet className="w-5 h-5 text-gold-hover" />
        <span>Accelerator simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Every dot is pushed forward {STEPS_PER_LAP} times per lap for {LAPS} laps — the loop from
        &ldquo;How a simulation thinks&rdquo;. The dashed circle is Part 3's r = mv/(qB), so you can see
        at a glance whether the simulated orbit still follows the formula.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <AcceleratorCanvas
            run={run}
            frame={frame}
            trailFrames={arrangement === 'bunch' ? 90 : undefined}
            showGap={rf}
            formulaRadius={run.formulaRadius}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setFrame(0)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
            <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
              lap {Math.min(LAPS, Math.floor((frame * run.frameDt) / run.formulaPeriod) + 1)} of {LAPS}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Particle</p>
            <Segmented
              options={(Object.keys(SPECIES) as SpeciesId[]).map((id) => ({ value: id, label: SPECIES[id].label }))}
              value={species}
              onChange={setSpecies}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Field B</span>
                <span className="text-deepteal font-bold">{B.toFixed(2)} T</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={1.5}
                step={0.05}
                value={B}
                onChange={(e) => setB(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Magnetic field"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Speed v</span>
                <span className="text-deepteal font-bold">{speedM.toFixed(2)}×10⁶ m/s</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.25}
                value={speedM}
                onChange={(e) => setSpeedM(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Injection speed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Beam</p>
            <Segmented
              options={[
                { value: 'single' as Arrangement, label: 'Single' },
                { value: 'pair' as Arrangement, label: 'Pair' },
                { value: 'bunch' as Arrangement, label: `Bunch of ${BUNCH_SIZE}` },
              ]}
              value={arrangement}
              onChange={setArrangement}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <label
              className={`flex items-center gap-1.5 text-[11px] font-mono cursor-pointer ${
                arrangement === 'single' ? 'text-deepteal-soft/50' : 'text-deepteal-soft'
              }`}
            >
              <input
                type="checkbox"
                checked={spaceCharge}
                disabled={arrangement === 'single'}
                onChange={(e) => setSpaceCharge(e.target.checked)}
                className="accent-gold"
              />
              Space charge
            </label>
            <select
              value={weight}
              disabled={!interacting}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="font-mono text-[11px] bg-cream border border-sage rounded px-1.5 py-1 text-deepteal disabled:opacity-50"
              aria-label="Real particles per dot"
            >
              {WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label} per dot
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={rf} onChange={(e) => setRf(e.target.checked)} className="accent-gold" />
              RF cavity ({RF_VOLTAGE / 1000} kV)
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={radiation}
                onChange={(e) => setRadiation(e.target.checked)}
                className="accent-gold"
              />
              Radiation loss
            </label>
          </div>

          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Pusher</p>
            <Segmented
              options={[
                { value: 'boris' as Pusher, label: 'Boris' },
                { value: 'euler' as Pusher, label: 'Euler' },
              ]}
              value={pusher}
              onChange={setPusher}
            />
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">r = mv/(qB)</dt>
            <dd className="text-deepteal text-right font-bold">{(run.formulaRadius * 100).toFixed(2)} cm</dd>
            <dt className="text-deepteal-soft">Measured radius</dt>
            <dd className="text-deepteal text-right font-bold">
              {(run.firstLapRadius * 100).toFixed(2)}
              {Math.abs(run.lastLapRadius - run.firstLapRadius) > 0.0005 && ` → ${(run.lastLapRadius * 100).toFixed(2)}`} cm
            </dd>
            <dt className="text-deepteal-soft">T = 2πm/(qB)</dt>
            <dd className="text-deepteal text-right font-bold">{(run.formulaPeriod * 1e9).toFixed(1)} ns</dd>
            <dt className="text-deepteal-soft">Measured time per lap</dt>
            <dd className="text-deepteal text-right font-bold">{(meanPeriod * 1e9).toFixed(1)} ns</dd>
            <dt className="text-deepteal-soft">Speed, start → end</dt>
            <dd className="text-deepteal text-right font-bold">
              {(run.initialSpeed / 1e6).toFixed(2)} → {(run.finalSpeed / 1e6).toFixed(2)}×10⁶ m/s
            </dd>
            {separation && turn && (
              <>
                <dt className="text-deepteal-soft">Pair separation</dt>
                <dd className="text-deepteal text-right font-bold">
                  {(separation[0] * 1000).toFixed(2)} → {(separation[separation.length - 1] * 1000).toFixed(2)} mm
                </dd>
                <dt className="text-deepteal-soft">Pair has turned</dt>
                <dd className="text-deepteal text-right font-bold">{Math.abs(turn[turn.length - 1]).toFixed(1)}°</dd>
              </>
            )}
            {rms && (
              <>
                <dt className="text-deepteal-soft">Bunch RMS size</dt>
                <dd className="text-deepteal text-right font-bold">
                  {(rms[0] * 1000).toFixed(2)} → {(rms[rms.length - 1] * 1000).toFixed(2)} mm
                </dd>
              </>
            )}
          </dl>

          {integratorDrift && (
            <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <span className="font-bold">Euler is inventing energy.</span> A magnetic field does no work,
                so the speed should not change — but it has drifted {pct(Math.abs(speedChange), 1)} and the
                orbit is spiralling outward. Switch to Boris, which turns the velocity without resizing it.
              </span>
            </p>
          )}

          {clean && (
            <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
              <span>
                The simulated orbit matches Part 3: radius within {pct(radiusGap, 3)} of r = mv/(qB), time per
                lap within {pct(periodGap, 3)} of T = 2πm/(qB).
                {arrangement === 'bunch' &&
                  ' With no space charge the bunch keeps its size exactly — every dot has the same lap time, so the shape comes back each lap.'}
              </span>
            </p>
          )}

          {!clean && !integratorDrift && (
            <div className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans space-y-1.5">
              {rf && (
                <p>
                  <span className="font-bold">RF cavity:</span> +{gainKeV.toFixed(1)} keV over {run.rfKicks} gap
                  crossings. Speed and radius grew, but the time per lap went from {(firstLapTime * 1e9).toFixed(1)} to{' '}
                  {(lastLapTime * 1e9).toFixed(1)} ns — unchanged, which is exactly why a fixed RF frequency stays in step.
                </p>
              )}
              {radiation && run.radiationBoost !== null && (
                <p>
                  <span className="font-bold">Radiation:</span> the radius shrank from{' '}
                  {(run.firstLapRadius * 100).toFixed(2)} to {(run.lastLapRadius * 100).toFixed(2)} cm. This loss is
                  exaggerated about {sci(run.radiationBoost)} times — a real {s.label.toLowerCase()} here would take
                  thousands of years to radiate noticeably. Electrons, about 1,800 times lighter, radiate billions of
                  times faster, which is why light sources use them.
                </p>
              )}
              {interacting && weight === 1 && (
                <p>
                  <span className="font-bold">Space charge:</span> with real single {particleWord}, the dots' repulsion is
                  about 10⁻¹¹ of the magnetic force — nothing you can see. Choose more particles per dot.
                </p>
              )}
              {interacting && weight > 1 && separation && turn && (
                <p>
                  <span className="font-bold">Space charge:</span> the two dots repel, but in a strong magnetic field that
                  shows up first as the pair turning around each other — {Math.abs(turn[turn.length - 1]).toFixed(0)}° over{' '}
                  {LAPS} laps — while their separation only went from {(separation[0] * 1000).toFixed(2)} to{' '}
                  {(separation[separation.length - 1] * 1000).toFixed(2)} mm.
                </p>
              )}
              {interacting && weight > 1 && rms && (
                <p>
                  <span className="font-bold">Space charge:</span> {sci(BUNCH_SIZE * weight)} {particleWord} pushing on
                  each other took the bunch from {(rms[0] * 1000).toFixed(1)} mm to {(rms[rms.length - 1] * 1000).toFixed(1)}{' '}
                  mm RMS, peaking at {(peakRms * 1000).toFixed(1)} mm on lap {peakLap}. No single formula predicts that
                  curve; it came from pushing every dot, every step.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
