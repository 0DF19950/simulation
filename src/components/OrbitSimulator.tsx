import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Satellite } from 'lucide-react';
import { OrbitCanvas } from './OrbitCanvas';
import {
  EARTH,
  Integrator,
  OrbitOutcome,
  OrbitParams,
  maxSeparationM,
  simulateOrbit,
} from '../utils/orbitalEngine';

const DEFAULTS: OrbitParams = {
  altitudeKm: 400,
  speedFactor: 1,
  gravityScale: 1,
  dtSeconds: 10,
  method: 'rk4',
  moonMassScale: 0,
};

const PRESETS: { label: string; hint: string; patch: Partial<OrbitParams> }[] = [
  { label: 'Too slow', hint: 'Case 1 · 0.80×', patch: { speedFactor: 0.8, gravityScale: 1 } },
  { label: 'Circular', hint: 'Case 2 · 1.00×', patch: { speedFactor: 1, gravityScale: 1 } },
  { label: 'Faster', hint: 'Case 3 · 1.25×', patch: { speedFactor: 1.25, gravityScale: 1 } },
  { label: 'Escape', hint: '≥ √2 ×', patch: { speedFactor: 1.45, gravityScale: 1 } },
  { label: 'No gravity', hint: 'Case 4 · G = 0', patch: { gravityScale: 0, speedFactor: 1 } },
];

const OUTCOME_COPY: Record<OrbitOutcome, { label: string; note: string; tone: string }> = {
  circular: {
    label: 'Circular orbit',
    note: 'Gravity bends the path by exactly enough to close it into a circle.',
    tone: 'bg-sage-light border-sage-dark text-deepteal',
  },
  elliptical: {
    label: 'Elliptical orbit',
    note: 'Still bound, but the speed now varies — fastest at periapsis, slowest at apoapsis.',
    tone: 'bg-gold-light border-gold text-deepteal',
  },
  impact: {
    label: 'Impact',
    note: 'Periapsis fell below the surface. Gravity won before the ground could curve away.',
    tone: 'bg-red-50 border-red-300 text-red-700',
  },
  escape: {
    label: 'Escape trajectory',
    note: 'Specific orbital energy is no longer negative — the satellite is not coming back.',
    tone: 'bg-sage-light border-sage-dark text-deepteal',
  },
  straight: {
    label: 'Straight line',
    note: 'With no gravity there is nothing to bend the path. Newton’s first law, drawn.',
    tone: 'bg-cream border-sage text-deepteal-soft',
  },
};

export const OrbitSimulator: React.FC = () => {
  const [params, setParams] = useState<OrbitParams>(DEFAULTS);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef<number>(0);

  const result = useMemo(() => simulateOrbit(params), [params]);

  // How far the Moon actually moves the satellite: same run, Moon removed.
  const moonEffectM = useMemo(() => {
    if (params.moonMassScale === 0) return null;
    const without = simulateOrbit({ ...params, moonMassScale: 0 });
    return maxSeparationM(result.points, without.points);
  }, [params, result]);

  useEffect(() => setStepIndex(0), [result]);

  useEffect(() => {
    if (!isPlaying) return;
    const total = result.points.length;
    const perFrame = Math.max(1, Math.round(total / 360)); // ~6 s per run at 60fps
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= total ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, result]);

  const set = <K extends keyof OrbitParams>(key: K, value: OrbitParams[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const current = result.points[Math.min(stepIndex, result.points.length - 1)];
  const outcome = OUTCOME_COPY[result.outcome];

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Satellite className="w-5 h-5 text-gold-hover" />
        <span>Orbit simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Give the satellite a starting altitude and a starting speed, then let gravity do the rest.
        Nothing here is a formula for an orbit — it is the two coupled equations from Part 5,
        stepped forward the way Part 6 describes.
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setParams((prev) => ({ ...prev, ...p.patch }))}
            className="font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border bg-cream border-sage text-deepteal-soft hover:border-gold hover:text-gold-hover transition-colors"
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <OrbitCanvas
            points={result.points}
            maxRadiusM={result.maxRadiusM}
            stepIndex={stepIndex}
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
              onClick={() => setStepIndex(0)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
            {current && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                t = {(current.t / 60).toFixed(1)} min
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className={`rounded-lg border p-3 ${outcome.tone}`}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
              {outcome.label}
            </p>
            <p className="text-xs mt-1 leading-relaxed">{outcome.note}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Altitude</span>
              <span className="text-deepteal font-bold">{params.altitudeKm} km</span>
            </div>
            <input
              type="range"
              min={200}
              max={20000}
              step={100}
              value={params.altitudeKm}
              onChange={(e) => set('altitudeKm', parseInt(e.target.value, 10))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Altitude"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Speed (× circular)</span>
              <span className="text-deepteal font-bold">{params.speedFactor.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={1.6}
              step={0.01}
              value={params.speedFactor}
              onChange={(e) => set('speedFactor', parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Speed factor"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={params.gravityScale === 1}
                onChange={(e) => set('gravityScale', e.target.checked ? 1 : 0)}
                className="accent-gold"
              />
              Gravity on
            </label>
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={params.moonMassScale > 0}
                onChange={(e) => set('moonMassScale', e.target.checked ? 1 : 0)}
                className="accent-gold"
              />
              Include the Moon
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['rk4', 'euler'] as Integrator[]).map((m) => (
              <button
                key={m}
                onClick={() => set('method', m)}
                className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border transition-colors ${
                  params.method === m
                    ? 'bg-deepteal border-deepteal text-cream font-bold'
                    : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
                }`}
              >
                {m === 'rk4' ? 'RK4' : 'Euler'}
              </button>
            ))}
            {[5, 10, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => set('dtSeconds', d)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-colors ${
                  params.dtSeconds === d
                    ? 'bg-gold border-gold text-deepteal font-bold'
                    : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
                }`}
              >
                Δt {d}s
              </button>
            ))}
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">Circular speed</dt>
            <dd className="text-deepteal text-right font-bold">
              {(result.circularSpeed / 1000).toFixed(2)} km/s
            </dd>
            <dt className="text-deepteal-soft">Initial speed</dt>
            <dd className="text-deepteal text-right font-bold">
              {(result.initialSpeed / 1000).toFixed(2)} km/s
            </dd>
            {current && (
              <>
                <dt className="text-deepteal-soft">Current speed</dt>
                <dd className="text-deepteal text-right font-bold">
                  {(current.speed / 1000).toFixed(2)} km/s
                </dd>
                <dt className="text-deepteal-soft">Current altitude</dt>
                <dd className="text-deepteal text-right font-bold">
                  {((current.r - EARTH.radiusM) / 1000).toFixed(0)} km
                </dd>
              </>
            )}
            {result.periapsisKm !== null && (
              <>
                <dt className="text-deepteal-soft">Periapsis</dt>
                <dd className="text-deepteal text-right font-bold">
                  {(() => {
                    const alt = result.periapsisKm - EARTH.radiusM / 1000;
                    // A negative altitude means the orbit passes through the planet,
                    // which is the real reason these runs end in impact. Say that
                    // rather than printing a negative height.
                    return alt >= 0
                      ? `${alt.toFixed(0)} km alt`
                      : `${Math.abs(alt).toFixed(0)} km below surface`;
                  })()}
                </dd>
              </>
            )}
            {result.apoapsisKm !== null && (
              <>
                <dt className="text-deepteal-soft">Apoapsis</dt>
                <dd className="text-deepteal text-right font-bold">
                  {(result.apoapsisKm - EARTH.radiusM / 1000).toFixed(0)} km alt
                </dd>
              </>
            )}
            {result.eccentricity !== null && (
              <>
                <dt className="text-deepteal-soft">Eccentricity</dt>
                <dd className="text-deepteal text-right font-bold">
                  {result.eccentricity.toFixed(3)}
                </dd>
              </>
            )}
            {result.periodMinutes !== null && (
              <>
                <dt className="text-deepteal-soft">Period</dt>
                <dd className="text-deepteal text-right font-bold">
                  {result.periodMinutes.toFixed(1)} min
                </dd>
              </>
            )}
          </dl>

          {result.energyDriftPct > 1 && result.outcome !== 'impact' && (
            <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans">
              <span className="font-bold">The method is distorting the orbit.</span> Orbital energy
              should be constant, but it has drifted{' '}
              <span className="font-mono">{result.energyDriftPct.toFixed(1)}%</span> across this run.
              The shape on screen is the integrator&apos;s error, not the physics — switch to RK4 or
              a smaller Δt and watch it settle.
            </p>
          )}

          {moonEffectM !== null && (
            <p className="bg-cream border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal-soft font-sans">
              <span className="font-bold text-deepteal">Challenge 5.</span> Over this run the Moon
              shifts the satellite by at most{' '}
              <span className="font-mono text-deepteal">
                {moonEffectM < 1000
                  ? `${moonEffectM.toFixed(1)} m`
                  : `${(moonEffectM / 1000).toFixed(1)} km`}
              </span>
              . Real, measurable, and nothing like the size of the orbit — which is exactly why
              mission planning needs numbers rather than intuition.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
