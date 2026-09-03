import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, GitBranch, Pause, Play, RotateCcw } from 'lucide-react';
import { DoublePendulumCanvas } from './DoublePendulumCanvas';
import {
  DoublePendulumParams,
  Integrator,
  divergenceSeries,
  simulateDoublePendulum,
} from '../utils/doublePendulumEngine';

const DEG = Math.PI / 180;
const TWIN_OFFSET_DEG = 0.5;

const DEFAULTS: DoublePendulumParams = {
  l1: 1,
  l2: 1,
  m1: 1,
  m2: 1,
  gravity: 9.81,
  theta1: 100 * DEG,
  theta2: 100 * DEG,
  omega1: 0,
  omega2: 0,
  dt: 0.01,
  method: 'rk4',
  durationS: 15,
};

const PRESETS: { label: string; hint: string; theta1Deg: number; theta2Deg: number }[] = [
  { label: 'Small angle', hint: 'Looks almost periodic', theta1Deg: 15, theta2Deg: 15 },
  { label: 'Large angle', hint: 'Chaotic tumbling', theta1Deg: 120, theta2Deg: 120 },
];

export const DoublePendulumSimulator: React.FC = () => {
  const [params, setParams] = useState<DoublePendulumParams>(DEFAULTS);
  const [compare, setCompare] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef<number>(0);

  const result = useMemo(() => simulateDoublePendulum(params), [params]);
  const twinResult = useMemo(
    () =>
      compare
        ? simulateDoublePendulum({ ...params, theta1: params.theta1 + TWIN_OFFSET_DEG * DEG })
        : null,
    [params, compare]
  );

  const divergence = useMemo(
    () => (twinResult ? divergenceSeries(result.points, twinResult.points) : null),
    [result, twinResult]
  );

  useEffect(() => setStepIndex(0), [result]);

  useEffect(() => {
    if (!isPlaying) return;
    const total = result.points.length;
    const perFrame = Math.max(1, Math.round(total / 600)); // ~10s per run at 60fps
    const tick = () => {
      setStepIndex((prev) => (prev + perFrame >= total ? 0 : prev + perFrame));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, result]);

  const set = <K extends keyof DoublePendulumParams>(key: K, value: DoublePendulumParams[K]) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const current = Math.min(stepIndex, result.points.length - 1);
  const currentDivergence = divergence ? divergence[current] : null;
  const finalDivergence = divergence ? divergence[divergence.length - 1] : null;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-gold-hover" />
        <span>Double pendulum simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        There's no formula to check this against — set the starting angles and watch what happens.
        Turn on &ldquo;compare a nearby start&rdquo; to release a second pendulum just{' '}
        {TWIN_OFFSET_DEG}° away and see how fast the two paths pull apart.
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setParams((prev) => ({ ...prev, theta1: p.theta1Deg * DEG, theta2: p.theta2Deg * DEG }))}
            className="font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border bg-cream border-sage text-deepteal-soft hover:border-gold hover:text-gold-hover transition-colors"
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <DoublePendulumCanvas
            points={result.points}
            twinPoints={twinResult?.points}
            maxReach={params.l1 + params.l2}
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
            <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
              t = {result.points[current]?.t.toFixed(1)} s
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Upper arm θ₁</span>
              <span className="text-deepteal font-bold">{(params.theta1 / DEG).toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={1}
              max={170}
              step={1}
              value={params.theta1 / DEG}
              onChange={(e) => set('theta1', parseFloat(e.target.value) * DEG)}
              className="w-full accent-gold cursor-pointer"
              aria-label="Upper arm starting angle"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Lower arm θ₂</span>
              <span className="text-deepteal font-bold">{(params.theta2 / DEG).toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={1}
              max={170}
              step={1}
              value={params.theta2 / DEG}
              onChange={(e) => set('theta2', parseFloat(e.target.value) * DEG)}
              className="w-full accent-gold cursor-pointer"
              aria-label="Lower arm starting angle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">m₂ / m₁</span>
                <span className="text-deepteal font-bold">{(params.m2 / params.m1).toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={params.m2 / params.m1}
                onChange={(e) => set('m2', parseFloat(e.target.value) * params.m1)}
                className="w-full accent-gold cursor-pointer"
                aria-label="Lower-to-upper mass ratio"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">L₂ / L₁</span>
                <span className="text-deepteal font-bold">{(params.l2 / params.l1).toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2.5}
                step={0.1}
                value={params.l2 / params.l1}
                onChange={(e) => set('l2', parseFloat(e.target.value) * params.l1)}
                className="w-full accent-gold cursor-pointer"
                aria-label="Lower-to-upper length ratio"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-mono text-deepteal-soft cursor-pointer">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="accent-gold"
              />
              Compare a nearby start (+{TWIN_OFFSET_DEG}°)
            </label>
            <div className="flex gap-1.5">
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
          </div>

          {compare && finalDivergence !== null && currentDivergence !== null && (
            <div className="bg-cream border border-sage/60 rounded-lg p-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-deepteal-soft">Separation right now</span>
                <span className="text-deepteal font-bold">{currentDivergence.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-deepteal-soft">Separation at t = {params.durationS}s</span>
                <span className="text-deepteal font-bold">{finalDivergence.toFixed(3)} m</span>
              </div>
              <p className="text-deepteal-soft pt-1 leading-relaxed">
                Both pendulums started {TWIN_OFFSET_DEG}° apart — closer than you could release two
                real pendulums by hand.
              </p>
            </div>
          )}

          {result.energyDriftPct > 2 && (
            <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Energy drifted <span className="font-mono">{result.energyDriftPct.toFixed(1)}%</span>{' '}
                over this run — with no friction, it should stay constant. That drift is the
                integrator's own error compounding, exactly what Part 6 warns about. Switch to RK4
                or a smaller Δt.
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
