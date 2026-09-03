import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Flame, Pause, Play, RotateCcw } from 'lucide-react';
import { ProjectileCanvas } from './ProjectileCanvas';
import { Integrator, RocketParams, simulateRocket } from '../utils/rocketEngine';

const DEFAULTS: RocketParams = {
  m0: 50000,
  mf: 10000,
  burnTime: 100,
  exhaustVelocity: 3000,
  gravity: 9.81,
  dragCoefficient: 0,
  gravityTurnDeg: 0,
  turnStartFrac: 0.2,
  dt: 0.05,
  method: 'rk4',
};

const ENGINE_PRESETS: { label: string; exhaustVelocity: number }[] = [
  { label: 'Solid', exhaustVelocity: 2500 },
  { label: 'Kerolox', exhaustVelocity: 3200 },
  { label: 'Hydrolox', exhaustVelocity: 4400 },
  { label: 'Ion', exhaustVelocity: 35000 },
];

const GRAVITY_PRESETS: { label: string; gravity: number }[] = [
  { label: 'Earth', gravity: 9.81 },
  { label: 'Mars', gravity: 3.71 },
];

export const RocketSimulator: React.FC = () => {
  const [params, setParams] = useState<RocketParams>(DEFAULTS);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef<number>(0);

  const result = useMemo(() => simulateRocket(params), [params]);

  useEffect(() => setStepIndex(0), [result]);

  useEffect(() => {
    if (!isPlaying) return;
    const total = result.points.length;
    const perFrame = Math.max(1, Math.round(total / 220));
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= total ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, result]);

  const set = <K extends keyof RocketParams>(key: K, value: RocketParams[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const current = result.points[Math.min(stepIndex, result.points.length - 1)];
  const massRatio = params.m0 / params.mf;
  const isClean = params.dragCoefficient === 0 && params.gravityTurnDeg === 0;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Flame className="w-5 h-5 text-gold-hover" />
        <span>Rocket simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Set the mass ratio, engine, and burn time, then watch mass, thrust, and acceleration all
        change together as it burns — the loop from Part 6, stepped forward one Δt at a time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <ProjectileCanvas
            points={result.points}
            maxRange={Math.max(...result.points.map((p) => p.x), 1)}
            maxHeight={Math.max(result.apogee, 1)}
            stepIndex={stepIndex}
            label="Rocket trajectory"
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
                t = {current.t.toFixed(1)} s {current.t < params.burnTime ? '· burning' : '· coasting'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Mass ratio (m₀ / m_f)</span>
              <span className="text-deepteal font-bold">{massRatio.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={2}
              max={12}
              step={0.5}
              value={massRatio}
              onChange={(e) => set('mf', params.m0 / parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Mass ratio"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Burn time</span>
              <span className="text-deepteal font-bold">{params.burnTime.toFixed(0)} s</span>
            </div>
            <input
              type="range"
              min={20}
              max={180}
              step={5}
              value={params.burnTime}
              onChange={(e) => set('burnTime', parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Burn time"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ENGINE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => set('exhaustVelocity', p.exhaustVelocity)}
                className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border transition-colors ${
                  params.exhaustVelocity === p.exhaustVelocity
                    ? 'bg-gold border-gold text-deepteal font-bold'
                    : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
                }`}
                title={`ve ≈ ${p.exhaustVelocity.toLocaleString()} m/s`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GRAVITY_PRESETS.map((g) => (
              <button
                key={g.label}
                onClick={() => set('gravity', g.gravity)}
                className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border transition-colors ${
                  params.gravity === g.gravity
                    ? 'bg-gold border-gold text-deepteal font-bold'
                    : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
                }`}
              >
                {g.label}
              </button>
            ))}
            {(['euler', 'rk4'] as Integrator[]).map((m) => (
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
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={params.gravityTurnDeg > 0}
                onChange={(e) => set('gravityTurnDeg', e.target.checked ? 45 : 0)}
                className="accent-gold"
              />
              Gravity turn
            </label>
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={params.dragCoefficient > 0}
                onChange={(e) => set('dragCoefficient', e.target.checked ? 0.01 : 0)}
                className="accent-gold"
              />
              Air resistance
            </label>
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">Mass ratio</dt>
            <dd className="text-deepteal text-right font-bold">{massRatio.toFixed(1)}×</dd>
            <dt className="text-deepteal-soft">Tsiolkovsky Δv</dt>
            <dd className="text-deepteal text-right font-bold">
              {result.tsiolkovskyDeltaV.toFixed(0)} m/s
            </dd>
            <dt className="text-deepteal-soft">Speed at burnout</dt>
            <dd className="text-deepteal text-right font-bold">{result.burnoutSpeed.toFixed(0)} m/s</dd>
            <dt className="text-deepteal-soft">Altitude at burnout</dt>
            <dd className="text-deepteal text-right font-bold">
              {(result.burnoutAltitude / 1000).toFixed(1)} km
            </dd>
            <dt className="text-deepteal-soft">Apogee</dt>
            <dd className="text-deepteal text-right font-bold">{(result.apogee / 1000).toFixed(1)} km</dd>
            <dt className="text-deepteal-soft">Lost to gravity{isClean ? '' : ' + drag/turn'}</dt>
            <dd className="text-deepteal text-right font-bold">
              {result.gravityLossEstimate.toFixed(0)} m/s
            </dd>
          </dl>

          {result.exactVerticalBurnoutSpeed !== null ? (
            <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
              <span>
                Straight up, no drag — this matches the closed form from Part 3 plus gravity loss:{' '}
                <span className="font-mono text-deepteal">
                  v = {result.exactVerticalBurnoutSpeed.toFixed(0)} m/s
                </span>
                . Turn on the gravity turn or air resistance to see where that formula stops
                applying.
              </span>
            </p>
          ) : (
            <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
              <span className="font-bold">
                {params.gravityTurnDeg > 0 && params.dragCoefficient > 0
                  ? 'Gravity turn and drag are on.'
                  : params.gravityTurnDeg > 0
                  ? 'Gravity turn is on.'
                  : 'Drag is on.'}
              </span>{' '}
              There is no closed-form formula for this flight — every number above came from
              stepping the simulation forward, not from algebra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
