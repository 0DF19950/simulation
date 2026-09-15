import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrickWall, CheckCircle2, Crosshair, Loader2, Pause, Play } from 'lucide-react';
import { TunnelingCanvas } from './TunnelingCanvas';
import { MD_INK, MD_SLOTS, MdChart, MdRule, MdSeries } from './MdChart';
import { usePlayback } from '../hooks/usePlayback';
import {
  Barrier,
  Grid,
  HB2M,
  HBAR,
  PacketRun,
  PairRun,
  decayRate,
  layersOf,
  makeGrid,
  packetEnergy,
  packetTransmission,
  potentialOn,
  runPacket,
  runPair,
  thickBarrierT,
  transmission,
  transmissionRect,
} from '../utils/tunnelingEngine';

type Setup = 'single' | 'double' | 'driven' | 'pair';

interface Params {
  setup: Setup;
  energy: number;
  height: number;
  width: number;
  dEnergy: number;
  dHeight: number;
  thickness: number;
  gap: number;
  longPacket: boolean;
  amplitude: number;
  period: number;
}

type Sim =
  | { kind: 'single'; grid: Grid; potential: Float64Array; run: PacketRun; exactAvg: number; exactCentre: number; p: Params }
  | {
      kind: 'double';
      grid: Grid;
      potential: Float64Array;
      run: PacketRun;
      exactAvg: number;
      exactCentre: number;
      singleCentre: number;
      curveE: Float64Array;
      curveDouble: Float64Array;
      curveSingle: Float64Array;
      resonance: { energy: number; peak: number; fwhm: number } | null;
      p: Params;
    }
  | { kind: 'driven'; grid: Grid; potential: Float64Array; run: PacketRun; still: PacketRun; exactStill: number; p: Params };

const SETUPS: { value: Setup; label: string }[] = [
  { value: 'single', label: 'One barrier' },
  { value: 'double', label: 'Two barriers' },
  { value: 'driven', label: 'Shaking barrier' },
  { value: 'pair', label: 'Two electrons' },
];
// A split-operator step must be short enough that the fastest wave the grid can hold,
// E_max = (ħ²/2m)(π/Δx)², turns less than a full cycle: Δt < 2πħ/E_max.
// One barrier: 0.05 nm and 0.025 fs, within 1% of the formula.
const FINE = makeGrid(1024, 0.05);
const DT_FINE = 0.025; // fs
// Two barriers need long, slow packets, so they use a 0.1 nm grid and 0.05 fs steps.
const SHORT = makeGrid(512, 0.1);
const LONG = makeGrid(1024, 0.1);
const DT = 0.05; // fs
const PAIR_GRID = makeGrid(128, 0.3);
const PAIR = {
  barrier: { start: 0, width: 0.9, height: 0.4 } as Barrier,
  energy: 0.3,
  width: 1.2,
  front: -5,
  back: -11,
  soft: 0.5,
  dt: 0.05,
  duration: 100,
  frames: 200,
  absorb: 3,
};
const STRENGTHS: { value: number; label: string }[] = [
  { value: 0.1, label: 'Weak' },
  { value: 0.3, label: 'Medium' },
  { value: 1, label: 'Full Coulomb' },
];
const PLAY_SECONDS: Record<Setup, number> = { single: 10, double: 14, driven: 10, pair: 12 };
/** Wave colours for the dark canvas, from the set validated there in Lesson 10. */
const FRONT = '#B8852F';
const BACK = '#27A08B';
const NOW = '#C59340';

const speed = (E: number) => (2 * HB2M * Math.sqrt(Math.max(E, 1e-6) / HB2M)) / HBAR; // nm/fs
const durationFor = (E: number, distance: number) => Math.min(300, Math.max(60, distance / speed(E) + 25));

function nearestResonance(xs: Float64Array, ys: Float64Array, near: number) {
  let best = -1;
  for (let i = 1; i < ys.length - 1; i++) {
    const isPeak = ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > 0.5;
    if (isPeak && (best < 0 || Math.abs(xs[i] - near) < Math.abs(xs[best] - near))) best = i;
  }
  if (best < 0) return null;
  const half = ys[best] / 2;
  let lo = best;
  let hi = best;
  while (lo > 0 && ys[lo] > half) lo--;
  while (hi < ys.length - 1 && ys[hi] > half) hi++;
  // Interpolate where the curve crosses half its height on each side.
  const cross = (i: number, j: number) => (ys[i] === ys[j] ? xs[i] : xs[i] + ((half - ys[i]) / (ys[j] - ys[i])) * (xs[j] - xs[i]));
  return { energy: xs[best], peak: ys[best], fwhm: cross(hi - 1, hi) - cross(lo, lo + 1) };
}

/** The lowest energy where two barriers pass nearly everything, rounded to the slider's step. */
function firstResonance(height: number, thickness: number, gap: number): number {
  const layers = layersOf([
    { start: 0, width: thickness, height },
    { start: thickness + gap, width: thickness, height },
  ]);
  let prev2 = 0;
  let prev1 = 0;
  for (let E = 0.0025; E < 1.3 * height; E += 0.0025) {
    const T = transmission(E, layers);
    if (prev1 > prev2 && prev1 >= T && prev1 > 0.5) return Math.round((E - 0.0025) / 0.005) * 0.005;
    prev2 = prev1;
    prev1 = T;
  }
  return 0.2;
}

function simulate(p: Params): Sim | null {
  if (p.setup === 'single') {
    const potential = potentialOn(FINE, [{ start: 0, width: p.width, height: p.height }]);
    const run = runPacket({ grid: FINE, potential, energy: p.energy, width: 1.5, start: -10, dt: DT_FINE, duration: durationFor(p.energy, 22) });
    const exactAvg = packetTransmission(p.energy, 1.5, (E) => transmissionRect(E, p.height, p.width));
    return { kind: 'single', grid: FINE, potential, run, exactAvg, exactCentre: transmissionRect(p.energy, p.height, p.width), p };
  }
  if (p.setup === 'double') {
    const grid = p.longPacket ? LONG : SHORT;
    const sigma = p.longPacket ? 6 : 3;
    const start = p.longPacket ? -25 : -14;
    const barriers = [
      { start: 0, width: p.thickness, height: p.dHeight },
      { start: p.thickness + p.gap, width: p.thickness, height: p.dHeight },
    ];
    const layers = layersOf(barriers);
    const potential = potentialOn(grid, barriers);
    const top = Math.min(2, Math.max(0.3, 1.3 * p.dHeight));
    const curveE = Float64Array.from({ length: 800 }, (_, i) => (top * (i + 1)) / 800);
    const curveDouble = curveE.map((E) => transmission(E, layers));
    const resonance = nearestResonance(curveE, curveDouble, p.dEnergy);
    // A resonance holds the wave between the barriers for about ħ/(its width); wait three of those.
    const dwell = resonance ? Math.min(300, (3 * HBAR) / resonance.fwhm) : 0;
    const duration = Math.min(500, durationFor(p.dEnergy, Math.abs(start) + 4 * sigma + 3) + Math.max(60, dwell));
    const run = runPacket({ grid, potential, energy: p.dEnergy, width: sigma, start, dt: DT, duration, frames: 300 });
    return {
      kind: 'double',
      grid,
      potential,
      run,
      exactAvg: packetTransmission(p.dEnergy, sigma, (E) => transmission(E, layers)),
      exactCentre: transmission(p.dEnergy, layers),
      singleCentre: transmissionRect(p.dEnergy, p.dHeight, p.thickness),
      curveE,
      curveDouble,
      curveSingle: curveE.map((E) => transmissionRect(E, p.dHeight, p.thickness)),
      resonance,
      p,
    };
  }
  if (p.setup === 'driven') {
    const potential = potentialOn(FINE, [{ start: 0, width: p.width, height: p.height }]);
    const common = { grid: FINE, potential, energy: p.energy, width: 1.5, start: -10, dt: DT_FINE, duration: durationFor(p.energy, 22) };
    const run = runPacket({ ...common, drive: { amplitude: p.amplitude, period: p.period } });
    const still = runPacket(common);
    const exactStill = packetTransmission(p.energy, 1.5, (E) => transmissionRect(E, p.height, p.width));
    return { kind: 'driven', grid: FINE, potential, run, still, exactStill, p };
  }
  return null;
}

function Segmented<T extends string | number>({
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
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border transition-colors ${
            value === o.value ? 'bg-deepteal border-deepteal text-cream font-bold' : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  text,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  text: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs font-mono mb-1">
        <span className="text-deepteal-soft">{label}</span>
        <span className="text-deepteal font-bold">{text}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-gold cursor-pointer"
        aria-label={label}
        aria-valuetext={text}
      />
    </div>
  );
}

/** A probability as a percentage, with enough digits to stay readable when it is tiny. */
function prob(v: number): string {
  if (!(v > 0)) return '0%';
  const p = 100 * v;
  if (p >= 10) return `${p.toFixed(1)}%`;
  if (p >= 0.1) return `${p.toFixed(2)}%`;
  if (p >= 0.001) return `${p.toPrecision(2)}%`;
  return `${p.toExponential(1)}%`;
}
/** For the running left/right notes: under a billionth is round-off in the packet's tails, not tunneling. */
const live = (v: number) => (v < 1e-9 ? '0%' : prob(v));
const eV = (v: number, digits = 2) => `${v.toFixed(digits)} eV`;
const shortNumber = (v: number) => String(Number(v.toFixed(3)));

function startPeak(run: PacketRun, n: number): number {
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, run.density[i]);
  return Math.min(run.peak, 2.2 * peak);
}

function probabilitySeries(run: PacketRun, insideLabel: string): MdSeries[] {
  return [
    { key: 'right', label: 'past the barrier', color: MD_SLOTS[0], values: run.right },
    { key: 'left', label: 'before it', color: MD_SLOTS[1], values: run.left },
    { key: 'inside', label: insideLabel, color: MD_SLOTS[2], values: run.inside },
  ];
}

const DOUBLE_THICKNESS = 0.3;
const DOUBLE_GAP = 1;

export const TunnelingSimulator: React.FC = () => {
  const [setup, setSetup] = useState<Setup>('single');
  const [energy, setEnergy] = useState(0.5);
  const [height, setHeight] = useState(1);
  const [width, setWidth] = useState(0.5);
  const [dHeight, setDHeight] = useState(1);
  const [thickness, setThickness] = useState(DOUBLE_THICKNESS);
  const [gap, setGap] = useState(DOUBLE_GAP);
  const [dEnergy, setDEnergy] = useState(() => firstResonance(1, DOUBLE_THICKNESS, DOUBLE_GAP));
  const [longPacket, setLongPacket] = useState(false);
  const [amplitude, setAmplitude] = useState(0.5);
  const [period, setPeriod] = useState(10);
  const [strength, setStrength] = useState(0.3);

  const params = useMemo<Params>(
    () => ({ setup, energy, height, width, dEnergy, dHeight, thickness, gap, longPacket, amplitude, period }),
    [setup, energy, height, width, dEnergy, dHeight, thickness, gap, longPacket, amplitude, period]
  );
  // Runs take a tenth of a second or so, so a slider being dragged only commits once it pauses.
  const [committed, setCommitted] = useState(params);
  useEffect(() => {
    if (params === committed) return;
    const id = setTimeout(() => setCommitted(params), params.setup !== committed.setup ? 0 : 140);
    return () => clearTimeout(id);
  }, [params, committed]);
  const pending = params !== committed;
  const sim = useMemo(() => simulate(committed), [committed]);

  // Two electrons: a few seconds of work, so it runs on request, in slices.
  const [pair, setPair] = useState<{ strength: number; run: PairRun | null; progress: number; running: boolean }>({
    strength: 0.3,
    run: null,
    progress: 0,
    running: false,
  });
  const pairToken = useRef(0);
  const reference = useMemo(() => {
    if (setup !== 'pair') return null;
    const potential = potentialOn(PAIR_GRID, [PAIR.barrier]);
    const one = (start: number) =>
      runPacket({ grid: PAIR_GRID, potential, energy: PAIR.energy, width: PAIR.width, start, dt: PAIR.dt, duration: PAIR.duration, frames: PAIR.frames, absorb: PAIR.absorb });
    return { potential, front: one(PAIR.front), back: one(PAIR.back) };
  }, [setup]);
  useEffect(() => {
    const token = pairToken;
    return () => {
      token.current++;
    };
  }, []);
  useEffect(() => {
    if (setup === 'pair') return;
    pairToken.current++;
    setPair((s) => (s.running ? { ...s, running: false, progress: 0 } : s));
  }, [setup]);
  const startPair = async () => {
    const token = ++pairToken.current;
    const chosen = strength;
    setPair({ strength: chosen, run: null, progress: 0, running: true });
    const run = await runPair(
      { grid: PAIR_GRID, ...PAIR, strength: chosen },
      (share) => {
        if (pairToken.current === token) setPair((s) => ({ ...s, progress: share }));
      },
      () => pairToken.current !== token
    );
    if (run && pairToken.current === token) setPair({ strength: chosen, run, progress: 1, running: false });
  };

  const activeRun: PacketRun | PairRun | null = setup === 'pair' ? pair.run : (sim?.run ?? null);
  const playSeconds = PLAY_SECONDS[setup];
  const play = usePlayback(playSeconds, activeRun);
  const nFrames = activeRun?.nFrames ?? 1;
  const frame = Math.max(0, Math.min(nFrames - 1, Math.round((play.t / playSeconds) * (nFrames - 1))));

  const tune = () => setDEnergy(firstResonance(dHeight, thickness, gap));

  // Charts are rebuilt only when a new run arrives, not on every animation frame.
  const charts = useMemo(() => {
    if (setup === 'pair' || !sim) return null;
    if (sim.kind === 'single') {
      const { p, run } = sim;
      const widths = Float64Array.from({ length: 20 }, (_, i) => 0.1 * (i + 1));
      const exactCurve = widths.map((L) => packetTransmission(p.energy, 1.5, (E) => transmissionRect(E, p.height, L), 800));
      const series: MdSeries[] = [{ key: 'exact', label: 'exact, averaged over the packet', color: MD_INK, values: exactCurve }];
      if (p.energy < p.height) {
        series.push({ key: 'shortcut', label: 'shortcut 16(E/V₀)(1−E/V₀)e^(−2κL)', color: MD_SLOTS[0], values: widths.map((L) => thickBarrierT(p.energy, p.height, L)), dashed: true });
      }
      return { widths, widthSeries: series, over: probabilitySeries(run, 'inside it') };
    }
    if (sim.kind === 'double') {
      return {
        energySeries: [
          { key: 'double', label: 'two barriers', color: MD_INK, values: sim.curveDouble },
          { key: 'single', label: 'one barrier alone', color: MD_SLOTS[0], values: sim.curveSingle, dashed: true },
        ] as MdSeries[],
        over: probabilitySeries(sim.run, 'between the barriers'),
      };
    }
    const { p } = sim;
    const Es = Float64Array.from({ length: 400 }, (_, i) => (Math.min(2.5, Math.max(1.5, 2 * p.height)) * (i + 1)) / 400);
    return {
      Es,
      stillCurve: [{ key: 'still', label: 'still barrier, exact', color: MD_INK, values: Es.map((E) => transmissionRect(E, p.height, p.width)) }] as MdSeries[],
      throughSeries: [
        { key: 'driven', label: 'shaking barrier', color: MD_SLOTS[0], values: sim.run.right },
        { key: 'still', label: 'same barrier held still', color: MD_INK, values: sim.still.right, dashed: true },
      ] as MdSeries[],
    };
  }, [sim, setup]);

  const pairSeries = useMemo((): MdSeries[] => {
    if (!pair.run || !reference) return [];
    return [
      { key: 'front', label: 'front, with repulsion', color: MD_SLOTS[0], values: pair.run.frontThrough },
      { key: 'back', label: 'back, with repulsion', color: MD_SLOTS[1], values: pair.run.backThrough },
      { key: 'front0', label: 'front, no repulsion', color: MD_SLOTS[0], values: reference.front.right, dashed: true },
      { key: 'back0', label: 'back, no repulsion', color: MD_SLOTS[1], values: reference.back.right, dashed: true },
    ];
  }, [pair.run, reference]);

  let rows: [string, string][] = [];
  let canvas: React.ReactNode = null;
  let chartBlock: React.ReactNode = null;
  let note: React.ReactNode = null;
  let controls: React.ReactNode = null;

  const energySlider = (
    <Slider label="Electron energy E" value={energy} min={0.05} max={2} step={0.05} text={eV(energy)} onChange={setEnergy} />
  );
  const heightSlider = <Slider label="Barrier height V₀" value={height} min={0.2} max={2} step={0.05} text={eV(height)} onChange={setHeight} />;
  const widthSlider = <Slider label="Barrier width L" value={width} min={0.1} max={1.5} step={0.1} text={`${width.toFixed(1)} nm`} onChange={setWidth} />;

  if (setup === 'single' || setup === 'driven') {
    controls = (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {energySlider}
        {heightSlider}
        {widthSlider}
        {setup === 'driven' && (
          <>
            <Slider label="Shake, ± of V₀" value={amplitude} min={0} max={0.8} step={0.05} text={`±${Math.round(amplitude * 100)}%`} onChange={setAmplitude} />
            <Slider label="Shake period" value={period} min={1} max={20} step={1} text={`${period} fs`} onChange={setPeriod} />
          </>
        )}
      </div>
    );
  } else if (setup === 'double') {
    controls = (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Slider label="Electron energy E" value={dEnergy} min={0.02} max={Math.round(1.3 * dHeight * 200) / 200} step={0.005} text={eV(dEnergy, 3)} onChange={setDEnergy} />
          <Slider label="Barrier height V₀" value={dHeight} min={0.5} max={1.5} step={0.05} text={eV(dHeight)} onChange={setDHeight} />
          <Slider label="Each barrier's width" value={thickness} min={0.1} max={0.4} step={0.1} text={`${thickness.toFixed(1)} nm`} onChange={setThickness} />
          <Slider label="Gap between them" value={gap} min={0.5} max={2} step={0.1} text={`${gap.toFixed(1)} nm`} onChange={setGap} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Packet</p>
          <Segmented
            options={[
              { value: 'short', label: 'Short (broad energy)' },
              { value: 'long', label: 'Long (sharp energy)' },
            ]}
            value={longPacket ? 'long' : 'short'}
            onChange={(v) => setLongPacket(v === 'long')}
          />
          <button
            onClick={tune}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
          >
            <Crosshair className="w-3 h-3" />
            Tune to resonance
          </button>
        </div>
      </>
    );
  } else {
    controls = (
      <div className="space-y-3">
        <p className="text-xs text-deepteal-soft">
          Two electrons with opposite spins, so they can be told apart, each at {PAIR.energy} eV, meet a barrier {PAIR.barrier.height} eV
          high and {PAIR.barrier.width} nm wide. The front one starts at {PAIR.front} nm, the back one at {PAIR.back} nm.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Repulsion</p>
          <Segmented options={STRENGTHS} value={strength} onChange={setStrength} />
          <button
            onClick={startPair}
            disabled={pair.running}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-gold text-deepteal font-bold hover:bg-gold-hover transition-colors disabled:opacity-60"
          >
            {pair.running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {pair.running ? `Running ${Math.round(pair.progress * 100)}%` : 'Run the pair'}
          </button>
        </div>
        {pair.running && (
          <div className="h-1.5 rounded bg-sage-light overflow-hidden" role="progressbar" aria-valuenow={Math.round(pair.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-gold transition-all" style={{ width: `${pair.progress * 100}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (sim?.kind === 'single' && charts && 'widths' in charts && charts.widths) {
    const { p, run } = sim;
    const last = run.nFrames - 1;
    const kappa = decayRate(p.energy, p.height);
    const below = p.energy < p.height;
    const nextFactor = transmissionRect(p.energy, p.height, p.width + 0.1) / transmissionRect(p.energy, p.height, p.width);
    const close = Math.abs(run.right[last] - sim.exactAvg) <= Math.max(0.003, 0.03 * sim.exactAvg);
    rows = [
      ['Decay rate κ inside', below ? `${kappa.toFixed(2)} nm⁻¹` : '— (E ≥ V₀)'],
      ['Exact T, centre energy', prob(sim.exactCentre)],
      ['Exact T, whole packet', prob(sim.exactAvg)],
      ['This run: through', prob(run.right[last])],
      ['This run: back', prob(run.left[last])],
      ['Packet energy spread', `±${packetEnergy(p.energy, 1.5).spread.toFixed(2)} eV`],
      [below ? 'Shortcut 16(E/V₀)(1−E/V₀)e^(−2κL)' : 'Shortcut', below ? prob(thickBarrierT(p.energy, p.height, p.width)) : 'only for E < V₀'],
      ['0.1 nm wider multiplies T by', nextFactor.toFixed(2)],
    ];
    canvas = (
      <TunnelingCanvas
        x={sim.grid.x}
        potential={sim.potential}
        traces={[{ density: run.density.subarray(frame * sim.grid.n, (frame + 1) * sim.grid.n), color: FRONT }]}
        energy={p.energy}
        peak={startPeak(run, sim.grid.n)}
        view={[-15, 15]}
        energyMax={Math.max(0.5, 1.3 * Math.max(p.height, p.energy))}
        caption={`t = ${run.times[frame].toFixed(1)} fs`}
        leftNote={`${live(run.left[frame])} left`}
        rightNote={`${live(run.right[frame])} right`}
        label="An electron wave packet meeting one rectangular barrier"
      />
    );
    chartBlock = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Tunneling probability vs width (log scale)</p>
          <MdChart
            x={charts.widths}
            series={charts.widthSeries}
            title="Exact tunneling probability against barrier width on a log scale, with the thick-barrier shortcut and this run marked"
            xName="width L"
            xUnit="nm"
            yName="T"
            yUnit="probability"
            formatY={prob}
            formatX={shortNumber}
            log
            rules={[{ x: p.width, label: 'this barrier' }]}
            dot={{ x: p.width, y: run.right[last], color: NOW }}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Where the probability is, over time</p>
          <MdChart
            x={run.times}
            series={charts.over}
            title="Probability before, inside and past the barrier over time"
            xName="time"
            xUnit="fs"
            yName="probability"
            yUnit="%"
            formatY={prob}
            formatTick={(v) => String(Math.round(v * 100))}
            formatX={shortNumber}
            yDomain={[0, 1.05]}
            rules={[{ y: sim.exactAvg, label: 'exact T' }]}
            playhead={frame}
          />
        </div>
      </>
    );
    note = (
      <p
        className={`${close ? 'bg-sage-light/40 border-sage-dark text-deepteal-soft' : 'bg-gold-light/60 border-gold text-deepteal'} border-l-2 rounded-r-lg p-3 text-xs font-sans flex items-start gap-2`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
        <span>
          {below
            ? `E is below V₀, so a classical ball would always bounce back — yet ${prob(run.right[last])} of this packet gets through. `
            : `E is above V₀, so a classical ball would always sail over — yet ${prob(run.left[last])} of this packet bounces back. `}
          The exact formula, averaged over the packet&apos;s spread of energies, gives {prob(sim.exactAvg)}
          {close ? ' — simulation and formula agree.' : '.'} At the centre energy alone the formula says {prob(sim.exactCentre)}: a real
          packet always carries a spread of energies, and its faster parts get through more easily.
        </span>
      </p>
    );
  } else if (sim?.kind === 'double' && charts && 'energySeries' in charts && charts.energySeries) {
    const { p, run, resonance } = sim;
    const last = run.nFrames - 1;
    const { spread } = packetEnergy(p.dEnergy, p.longPacket ? 6 : 3);
    rows = [
      ['Nearest resonance', resonance ? `${resonance.energy.toFixed(3)} eV, ${Math.round(resonance.fwhm * 1000)} meV wide` : 'none below the top'],
      ['Two barriers, exact at E', prob(sim.exactCentre)],
      ['One barrier alone at E', prob(sim.singleCentre)],
      ['Exact, whole packet', prob(sim.exactAvg)],
      ['This run: through', prob(run.right[last])],
      ['Still between the barriers', prob(run.inside[last])],
      ['Packet energy spread', `±${(spread * 1000).toFixed(0)} meV`],
    ];
    const spanEnd = p.thickness * 2 + p.gap;
    canvas = (
      <TunnelingCanvas
        x={sim.grid.x}
        potential={sim.potential}
        traces={[{ density: run.density.subarray(frame * sim.grid.n, (frame + 1) * sim.grid.n), color: FRONT }]}
        energy={p.dEnergy}
        peak={startPeak(run, sim.grid.n)}
        view={p.longPacket ? [-35, 20 + spanEnd] : [-18, 14 + spanEnd]}
        energyMax={Math.max(0.5, 1.3 * p.dHeight)}
        caption={`t = ${run.times[frame].toFixed(1)} fs`}
        leftNote={`${live(run.left[frame])} left`}
        rightNote={`${live(run.right[frame])} right`}
        label="An electron wave packet meeting two barriers, with part of the wave caught between them"
      />
    );
    chartBlock = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Exact tunneling probability vs energy</p>
          <MdChart
            x={sim.curveE}
            series={charts.energySeries}
            title="Exact transmission against energy for two barriers, with one barrier alone for comparison and the packet's energy marked"
            xName="energy E"
            xUnit="eV"
            yName="T"
            yUnit="%"
            formatY={prob}
            formatTick={(v) => String(Math.round(v * 100))}
            formatX={shortNumber}
            yDomain={[0, 1.05]}
            rules={[
              { x: p.dEnergy, label: 'packet' },
              { x: p.dEnergy - spread, label: '' },
              { x: p.dEnergy + spread, label: '' },
            ]}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Where the probability is, over time</p>
          <MdChart
            x={run.times}
            series={charts.over}
            title="Probability before, between and past the two barriers over time"
            xName="time"
            xUnit="fs"
            yName="probability"
            yUnit="%"
            formatY={prob}
            formatTick={(v) => String(Math.round(v * 100))}
            formatX={shortNumber}
            yDomain={[0, 1.05]}
            rules={[{ y: sim.exactAvg, label: 'exact, whole packet' }]}
            playhead={frame}
          />
        </div>
      </>
    );
    note = (
      <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
        <span className="font-bold">Resonance.</span> At {eV(p.dEnergy, 3)}, the two barriers together pass {prob(sim.exactCentre)} of a
        wave, where one of them alone passes {prob(sim.singleCentre)} — the wave bouncing between them lines up with itself and piles up in
        the gap. The packet&apos;s energies spread ±{(spread * 1000).toFixed(0)} meV
        {resonance ? `, against a resonance about ${Math.round(resonance.fwhm * 1000)} meV wide` : ''}, so only part of it fits: this run
        sends {prob(run.right[last])} through, against {prob(sim.exactAvg)} from the exact curve averaged over the packet.{' '}
        {run.inside[last] > 0.01 ? `${prob(run.inside[last])} is still caught between the barriers when the run ends, leaking out a little each way. ` : ''}
        {p.longPacket ? 'This long packet has a sharper energy — switch to the short one and watch less of it fit.' : 'A longer packet has a more precisely known energy — switch to it and watch more of it get through.'}
      </p>
    );
  } else if (sim?.kind === 'driven' && charts && 'throughSeries' in charts && charts.throughSeries) {
    const { p, run, still } = sim;
    const last = run.nFrames - 1;
    const hw = (2 * Math.PI * HBAR) / p.period;
    const scale = run.heightScale[frame];
    rows = [
      ['Barrier height now', eV(p.height * scale)],
      ['Shake energy ħω = h/period', eV(hw)],
      ['Shaking barrier: through', prob(run.right[last])],
      ['Held still: through', prob(still.right[still.nFrames - 1])],
      ['Held still: exact', prob(sim.exactStill)],
    ];
    canvas = (
      <TunnelingCanvas
        x={sim.grid.x}
        potential={sim.potential.map((v) => v * scale)}
        traces={[{ density: run.density.subarray(frame * sim.grid.n, (frame + 1) * sim.grid.n), color: FRONT }]}
        energy={p.energy}
        peak={startPeak(run, sim.grid.n)}
        view={[-15, 15]}
        energyMax={Math.max(0.5, 1.3 * Math.max(p.height * (1 + p.amplitude), p.energy))}
        caption={`t = ${run.times[frame].toFixed(1)} fs`}
        leftNote={`${live(run.left[frame])} left`}
        rightNote={`${live(run.right[frame])} right`}
        label="An electron wave packet meeting a barrier whose height oscillates in time"
      />
    );
    chartBlock = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Probability past the barrier: shaking vs still</p>
          <MdChart
            x={run.times}
            series={charts.throughSeries}
            title="Probability past the barrier over time, for the shaking barrier and the same barrier held still"
            xName="time"
            xUnit="fs"
            yName="through"
            yUnit="%"
            formatY={prob}
            formatTick={(v) => String(Math.round(v * 100))}
            formatX={shortNumber}
            playhead={frame}
            endLabels
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Still barrier: exact T vs energy (log scale)</p>
          <MdChart
            x={charts.Es as Float64Array}
            series={charts.stillCurve as MdSeries[]}
            title="Exact transmission of the still barrier against energy on a log scale, with the electron's energy and one shake quantum either side marked"
            xName="energy E"
            xUnit="eV"
            yName="T"
            yUnit="probability"
            formatY={prob}
            formatX={shortNumber}
            log
            rules={[
              { x: p.energy, label: 'E' } as MdRule,
              { x: p.energy + hw, label: 'E + ħω' },
              ...(p.energy - hw > 0 ? [{ x: p.energy - hw, label: 'E − ħω' }] : []),
            ]}
          />
        </div>
      </>
    );
    note = (
      <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
        <span className="font-bold">No formula for this one.</span> Shaking the barrier ±{Math.round(p.amplitude * 100)}% every {p.period} fs
        sends {prob(run.right[last])} of the packet through, where the same barrier held still sends {prob(still.right[still.nFrames - 1])}.
        The height is different at every moment the wave is inside, so there is no fixed shape to plug into the formula. Quantum mechanics
        adds a twist: a barrier shaking at frequency ω can hand the electron energy — or take it away — in steps of ħω ={' '}
        {eV(hw)}, and the right-hand chart shows how different the barrier looks from those energies.
      </p>
    );
  } else if (setup === 'pair' && reference) {
    const run = pair.run;
    const n = PAIR_GRID.n;
    const f0 = reference.front;
    const b0 = reference.back;
    const tf = f0.right[f0.nFrames - 1];
    const tb = b0.right[b0.nFrames - 1];
    const independent = { both: tf * tb, frontOnly: tf * (1 - tb), backOnly: (1 - tf) * tb, bothBack: (1 - tf) * (1 - tb) };
    rows = run
      ? [
          ['Front through, no repulsion', prob(tf)],
          ['Front through, with repulsion', prob(run.frontThrough[run.nFrames - 1])],
          ['Back through, no repulsion', prob(tb)],
          ['Back through, with repulsion', prob(run.backThrough[run.nFrames - 1])],
        ]
      : [
          ['Each through, no repulsion', prob(tf)],
          ['Both through, no repulsion', prob(independent.both)],
        ];
    const fr = run ? run.frontDensity.subarray(frame * n, (frame + 1) * n) : f0.density.subarray(0, n);
    const bk = run ? run.backDensity.subarray(frame * n, (frame + 1) * n) : b0.density.subarray(0, n);
    canvas = (
      <TunnelingCanvas
        x={PAIR_GRID.x}
        potential={reference.potential}
        traces={[
          { density: fr, color: FRONT },
          { density: bk, color: BACK },
        ]}
        energy={PAIR.energy}
        peak={run ? run.peak : Math.max(f0.peak, b0.peak)}
        view={[-16, 16]}
        energyMax={0.6}
        caption={run ? `t = ${run.times[frame].toFixed(1)} fs · strength ${Math.round(pair.strength * 100)}%` : 'Press “Run the pair”'}
        leftNote="gold: front electron"
        rightNote="teal: back electron"
        label="Two repelling electrons meeting one barrier; each electron's probability density is drawn in its own colour"
      />
    );
    if (run) {
      const o = run.outcome;
      const outcomeRows: [string, number, number][] = [
        ['Both through', independent.both, o.bothThrough],
        ['Front only', independent.frontOnly, o.frontOnly],
        ['Back only', independent.backOnly, o.backOnly],
        ['Both bounce back', independent.bothBack, o.bothBack],
      ];
      const frontEnd = run.frontThrough[run.nFrames - 1];
      const backEnd = run.backThrough[run.nFrames - 1];
      chartBlock = (
        <>
          <div className="space-y-1.5 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Chance each electron is through, over time</p>
            <MdChart
              x={run.times}
              series={pairSeries}
              title="Probability that the front and the back electron are past the barrier over time, with and without repulsion"
              xName="time"
              xUnit="fs"
              yName="through"
              yUnit="%"
              formatY={prob}
              formatTick={(v) => String(Math.round(v * 100))}
              formatX={shortNumber}
              playhead={frame}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">How the pair ends up</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[280px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-3 font-bold">Outcome</th>
                    <th className="text-right py-2 px-2 font-bold">No repulsion</th>
                    <th className="text-right py-2 pl-2 font-bold">With repulsion</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomeRows.map(([label, without, withRep]) => (
                    <tr key={label} className="border-b border-sage/30">
                      <td className="py-2 pr-3 text-deepteal-soft">{label}</td>
                      <td className="py-2 px-2 text-right text-deepteal">{prob(without)}</td>
                      <td className="py-2 pl-2 text-right text-deepteal font-bold">{prob(withRep)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {o.undecided > 0.005 && <p className="text-[10px] text-deepteal-soft">{prob(o.undecided)} is still inside the barrier when the run ends.</p>}
          </div>
        </>
      );
      note = (
        <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
          <span className="font-bold">No longer two coin flips.</span> Without repulsion each electron is on its own: {prob(tf)} each, so
          both get through {prob(independent.both)} of the time. With repulsion the back electron pushes the front one forward and is pushed
          back itself — the front one gets through {prob(frontEnd)}, the back one {prob(backEnd)} — and the outcomes are tied together: both
          get through {prob(o.bothThrough)} of the time, not the {prob(frontEnd * backEnd)} that multiplying would suggest. No single-particle
          formula gives these numbers. (This setup uses a coarser 0.3 nm grid, so compare the two columns with each other rather than with
          the formula.)
        </p>
      );
    } else {
      note = (
        <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans">
          The two electrons share one wavefunction that depends on both of their positions at once — a 128 × 128 grid instead of a line —
          so this one takes a few seconds. Without repulsion, each gets through {prob(tf)} of the time. Predict what repulsion does, then
          run it.
        </p>
      );
    }
  }

  const finishedAt = activeRun ? activeRun.times[frame] : 0;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <BrickWall className="w-5 h-5 text-gold-hover" />
        <span>Quantum tunneling simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        An electron&apos;s wave packet — a Gaussian bump of probability moving right — meets barriers taller than its energy. The
        wavefunction is updated at every grid point, every few hundredths of a femtosecond, and each run is checked against the exact answer
        whenever there is one.
      </p>

      <div className="space-y-2">
        {canvas}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={play.toggle}
            disabled={!activeRun}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors disabled:opacity-50"
          >
            {play.playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {play.playing ? 'Pause' : play.finished ? 'Replay' : 'Play'}
          </button>
          <input
            type="range"
            min={0}
            max={playSeconds}
            step={0.01}
            value={play.t}
            onChange={(e) => play.seek(parseFloat(e.target.value))}
            disabled={!activeRun}
            className="flex-1 min-w-[8rem] accent-gold cursor-pointer"
            aria-label="Scrub through the run"
            aria-valuetext={`${finishedAt.toFixed(1)} fs`}
          />
          <span className="font-mono text-[10px] text-deepteal-soft">t = {finishedAt.toFixed(1)} fs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-3 space-y-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Setup</p>
            <Segmented options={SETUPS} value={setup} onChange={setSetup} />
          </div>
          {controls}
        </div>
        <dl
          className={`lg:col-span-2 bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px] transition-opacity ${pending ? 'opacity-60' : ''}`}
        >
          {rows.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-deepteal-soft">{k}</dt>
              <dd className="text-deepteal text-right font-bold break-words">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>

      {chartBlock && <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 transition-opacity ${pending ? 'opacity-60' : ''}`}>{chartBlock}</div>}

      {note}
    </div>
  );
};
