import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, Rocket, RotateCcw } from 'lucide-react';
import { ProjectileCanvas } from './ProjectileCanvas';
import { ProjectileParams, Integrator, simulateProjectile } from '../utils/projectileEngine';

const DEFAULTS: ProjectileParams = {
  speed: 20,
  angleDeg: 45,
  gravity: 9.81,
  dragCoefficient: 0,
  windSpeed: 0,
  dt: 0.02,
  method: 'rk4',
};

const ANGLE_PRESETS: { label: string; hint: string; angleDeg: number }[] = [
  { label: '15°', hint: 'Long, low, flat arc', angleDeg: 15 },
  { label: '45°', hint: 'Maximum range (no drag)', angleDeg: 45 },
  { label: '75°', hint: 'Short, tall, steep arc', angleDeg: 75 },
];

const GRAVITY_PRESETS: { label: string; gravity: number }[] = [
  { label: 'Earth', gravity: 9.81 },
  { label: 'Moon', gravity: 1.62 },
  { label: 'Mars', gravity: 3.71 },
];

export const ProjectileSimulator: React.FC = () => {
  const [params, setParams] = useState<ProjectileParams>(DEFAULTS);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef<number>(0);

  const result = useMemo(() => simulateProjectile(params), [params]);

  useEffect(() => setStepIndex(0), [result]);

  useEffect(() => {
    if (!isPlaying) return;
    const total = result.points.length;
    const perFrame = Math.max(1, Math.round(total / 150)); // ~2.5 s per run at 60fps
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= total ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, result]);

  const set = <K extends keyof ProjectileParams>(key: K, value: ProjectileParams[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const current = result.points[Math.min(stepIndex, result.points.length - 1)];
  const noDrag = params.dragCoefficient === 0;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Rocket className="w-5 h-5 text-gold-hover" />
        <span>Projectile simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Give the ball a launch speed and angle, then let gravity — and optionally drag and wind —
        do the rest. This is the two coupled equations from Part 3, stepped forward the way Part 6
        describes.
      </p>

      <div className="flex flex-wrap gap-2">
        {ANGLE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => set('angleDeg', p.angleDeg)}
            className="font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border bg-cream border-sage text-deepteal-soft hover:border-gold hover:text-gold-hover transition-colors"
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <ProjectileCanvas
            points={result.points}
            maxRange={Math.max(result.range, 1)}
            maxHeight={Math.max(result.maxHeight, 1)}
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
                t = {current.t.toFixed(2)} s
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Launch speed</span>
              <span className="text-deepteal font-bold">{params.speed.toFixed(0)} m/s</span>
            </div>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={params.speed}
              onChange={(e) => set('speed', parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Launch speed"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Launch angle θ</span>
              <span className="text-deepteal font-bold">{params.angleDeg.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={5}
              max={85}
              step={1}
              value={params.angleDeg}
              onChange={(e) => set('angleDeg', parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Launch angle"
            />
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
                checked={params.dragCoefficient > 0}
                onChange={(e) => set('dragCoefficient', e.target.checked ? 0.02 : 0)}
                className="accent-gold"
              />
              Air resistance
            </label>
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={params.windSpeed > 0}
                disabled={params.dragCoefficient === 0}
                onChange={(e) => set('windSpeed', e.target.checked ? 6 : 0)}
                className="accent-gold disabled:opacity-40"
              />
              <span className={params.dragCoefficient === 0 ? 'opacity-40' : ''}>
                Sideways wind
              </span>
            </label>
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">Range</dt>
            <dd className="text-deepteal text-right font-bold">{result.range.toFixed(1)} m</dd>
            <dt className="text-deepteal-soft">Max height</dt>
            <dd className="text-deepteal text-right font-bold">{result.maxHeight.toFixed(1)} m</dd>
            <dt className="text-deepteal-soft">Time of flight</dt>
            <dd className="text-deepteal text-right font-bold">{result.timeOfFlight.toFixed(2)} s</dd>
          </dl>

          {result.analytic ? (
            <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
              <span>
                No drag yet — this matches the closed-form formula from Part 3:{' '}
                <span className="font-mono text-deepteal">
                  range = {result.analytic.range.toFixed(1)} m
                </span>
                . Turn on air resistance to see where that formula stops applying.
              </span>
            </p>
          ) : (
            <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
              <span className="font-bold">Drag is on.</span> There is no closed-form formula for
              this trajectory — every number above came from stepping the simulation forward, not
              from algebra.
            </p>
          )}

          {noDrag && result.energyDriftPct > 1 && (
            <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans">
              <span className="font-bold">The method is distorting the flight.</span> With no drag,
              energy should be exactly conserved, but it drifted{' '}
              <span className="font-mono">{result.energyDriftPct.toFixed(1)}%</span> over this run.
              That's the integrator's error, not the physics — switch to RK4 or a smaller Δt.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
