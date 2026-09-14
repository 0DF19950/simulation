import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bubbles, CheckCircle2, Dices, Pause, Play, RotateCcw } from 'lucide-react';
import { MdCanvas } from './MdCanvas';
import { MD_INK, MD_SLOTS, MdChart, MdRule, MdSeries, powerOfTen } from './MdChart';
import { usePlayback } from '../hooks/usePlayback';
import {
  ARGON,
  MdIntegrator,
  MdRun,
  PairAnalysis,
  Phase,
  TrioOutcome,
  analysePair,
  bondsIntact,
  classifyPhase,
  clusterAtoms,
  clusterBox,
  distanceAt,
  equilibriumSeparation,
  largestClusterMask,
  ljPotential,
  pairAtoms,
  pairEnergy,
  pairTimeStep,
  runMd,
  shooterTrio,
  temperatureSeries,
  trioOutcome,
  twinGap,
} from '../utils/mdEngine';

type Scenario = 'pair' | 'trio' | 'cluster';

type Sim =
  | { kind: 'pair'; run: MdRun; dt: number; analysis: PairAnalysis }
  | { kind: 'trio'; run: MdRun; twin: MdRun; gap: Float64Array; outcome: TrioOutcome; twinOutcome: TrioOutcome }
  | { kind: 'cluster'; run: MdRun; box: number; bonds: Float64Array; temps: Float64Array; phase: Phase; bondShare: number; largest: number };

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'pair', label: 'Two atoms' },
  { value: 'trio', label: 'Add a third' },
  { value: 'cluster', label: 'Cluster' },
];
const INTEGRATORS: { value: MdIntegrator; label: string }[] = [
  { value: 'verlet', label: 'Velocity Verlet' },
  { value: 'euler', label: 'Euler' },
];
const DURATION: Record<Scenario, number> = { pair: 25, trio: 150, cluster: 100 }; // ps
const PLAY_SECONDS: Record<Scenario, number> = { pair: 12, trio: 20, cluster: 16 };
const DT = 0.01; // ps
const SIZES = [7, 19, 37, 100];
const TEMPERATURES = [20, 60, 100, 160, 300]; // K
const NUDGES: { value: number; label: string }[] = [
  { value: -3, label: '10⁻³ nm' },
  { value: -6, label: '10⁻⁶ nm' },
  { value: -9, label: '10⁻⁹ nm' },
];
const NUDGE_WORDS: Record<number, string> = {
  [-3]: 'about a three-hundredth of an atom’s width',
  [-6]: 'about the size of a proton',
  [-9]: 'about a thousandth of a proton',
};
const PHASE_WORDS: Record<Phase, string> = { solid: 'a solid', liquid: 'a liquid', gas: 'a gas' };
/** Atom colours for the dark canvas, validated there (all pairs): colour-blind ΔE ≥ 9.3, normal-vision ΔE ≥ 17.5, contrast ≥ 3:1. */
const ATOMS = ['#B8852F', '#27A08B', '#9D6FC0'];
const TRIO_LABELS = ['A', 'B', 'C'];
const NOW = '#C59340';

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
  unit,
  digits = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  digits?: number;
  onChange: (v: number) => void;
}) {
  const text = `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)} ${unit}`;
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

const meV = (v: number, digits = 2) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}`;
const pctOf = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;
const shortNumber = (v: number) => String(Number(v.toFixed(3)));

/** Small distances in scientific notation, e.g. 4.8×10⁻³. */
function sci(v: number): string {
  if (!(v > 0)) return '0';
  if (v >= 0.01) return v.toFixed(2);
  const k = Math.floor(Math.log10(v));
  return `${(v / 10 ** k).toFixed(1)}×${powerOfTen(k)}`;
}

function describe(o: TrioOutcome, end: number): string {
  if (o.kind === 'together') return `still a trio at ${end} ps`;
  if (o.kind === 'apart') return `all three fly apart, ${o.time.toFixed(0)} ps`;
  return o.atom === 2 ? `C leaves again, ${o.time.toFixed(0)} ps` : `C stays, knocks ${TRIO_LABELS[o.atom]} out, ${o.time.toFixed(0)} ps`;
}

const sameEnding = (a: TrioOutcome, b: TrioOutcome) =>
  a.kind === b.kind && (a.kind !== 'ejected' || (b.kind === 'ejected' && a.atom === b.atom));

function meanFrom(values: ArrayLike<number>, from: number): number {
  let sum = 0;
  let count = 0;
  for (let i = Math.max(0, from); i < values.length; i++) {
    sum += values[i];
    count++;
  }
  return count ? sum / count : 0;
}

export const MdSimulator: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>('pair');
  const [integrator, setIntegrator] = useState<MdIntegrator>('verlet');
  const [epsilon, setEpsilon] = useState<number>(ARGON.epsilon);
  const [sigma, setSigma] = useState<number>(ARGON.sigma);
  const [r0, setR0] = useState(0.5);
  const [push, setPush] = useState(0);
  const [speed, setSpeed] = useState(60);
  const [aim, setAim] = useState(0.14);
  const [nudgeExp, setNudgeExp] = useState(-6);
  const [size, setSize] = useState(37);
  const [temperature, setTemperature] = useState(60);
  const [seed, setSeed] = useState(1);

  // Closer than about 0.85σ the repulsion is so violent the atoms leave at supersonic speed.
  const r0Min = Math.ceil(0.85 * sigma * 100) / 100;
  const r0Eff = Math.max(r0, r0Min);

  const sim = useMemo((): Sim => {
    if (scenario === 'pair') {
      const approach = push / 1000; // nm/ps
      const energy = pairEnergy(r0Eff, approach, epsilon, sigma, ARGON.massU);
      const dt = pairTimeStep(energy, epsilon, sigma, ARGON.massU);
      const run = runMd({
        atoms: pairAtoms(r0Eff, approach),
        epsilon,
        sigma,
        massU: ARGON.massU,
        dt,
        steps: Math.round(DURATION.pair / dt),
        integrator,
        maxFrames: 2500,
      });
      return { kind: 'pair', run, dt, analysis: analysePair(run, epsilon, sigma, ARGON.massU) };
    }
    if (scenario === 'trio') {
      const shared = { epsilon: ARGON.epsilon, sigma: ARGON.sigma, massU: ARGON.massU, dt: DT, steps: Math.round(DURATION.trio / DT), integrator, maxFrames: 3000 };
      const run = runMd({ ...shared, atoms: shooterTrio(ARGON.sigma, speed / 1000, aim) });
      const twin = runMd({ ...shared, atoms: shooterTrio(ARGON.sigma, speed / 1000, aim, 10 ** nudgeExp) });
      return { kind: 'trio', run, twin, gap: twinGap(run, twin), outcome: trioOutcome(run, ARGON.sigma), twinOutcome: trioOutcome(twin, ARGON.sigma) };
    }
    const box = clusterBox(size, ARGON.sigma);
    const run = runMd({
      atoms: clusterAtoms(size, ARGON.sigma, ARGON.massU, temperature, seed),
      epsilon: ARGON.epsilon,
      sigma: ARGON.sigma,
      massU: ARGON.massU,
      dt: DT,
      steps: Math.round(DURATION.cluster / DT),
      integrator,
      box,
      maxFrames: 1000,
    });
    const bonds = bondsIntact(run, ARGON.sigma);
    const { phase, bondShare, largest } = classifyPhase(run, bonds, ARGON.sigma);
    return { kind: 'cluster', run, box, bonds, temps: temperatureSeries(run), phase, bondShare, largest };
  }, [scenario, integrator, epsilon, sigma, r0Eff, push, speed, aim, nudgeExp, size, temperature, seed]);

  const { run } = sim;
  const duration = DURATION[scenario];
  const playSeconds = PLAY_SECONDS[scenario];
  const play = usePlayback(playSeconds, sim);
  const frameDt = run.nFrames > 1 ? run.times[1] - run.times[0] : 1;
  const frame = Math.max(0, Math.min(run.nFrames - 1, Math.round(((play.t / playSeconds) * duration) / frameDt)));
  const last = run.nFrames - 1;

  // Pairs plot raw energies, so E < 0 reads directly as bound; bigger systems plot the change
  // since t = 0, where the trade between kinetic and potential energy is visible.
  const energySeries = useMemo((): MdSeries[] => {
    const relative = sim.kind !== 'pair';
    const values = (a: Float64Array) => (relative ? a.map((v) => v - a[0]) : a);
    return [
      { key: 'kinetic', label: 'kinetic', color: MD_SLOTS[0], values: values(sim.run.kinetic) },
      { key: 'potential', label: 'potential', color: MD_SLOTS[1], values: values(sim.run.potential) },
      { key: 'total', label: 'total', color: MD_INK, values: values(sim.run.total) },
    ];
  }, [sim]);

  const well = useMemo(() => {
    if (sim.kind !== 'pair') return null;
    const rs = Float64Array.from({ length: 341 }, (_, k) => 0.25 + k * 0.0025);
    const energy = sim.analysis.energy;
    const series: MdSeries[] = [
      { key: 'u', label: 'potential energy U(r)', color: MD_SLOTS[1], values: rs.map((r) => ljPotential(r, epsilon, sigma)) },
      { key: 'e', label: 'total energy E', color: MD_INK, values: new Float64Array(rs.length).fill(energy) },
    ];
    const rules: MdRule[] = [
      { x: equilibriumSeparation(sigma), label: 'r_min' },
      { x: sim.analysis.exactInner, label: 'turning point' },
    ];
    if (sim.analysis.exactOuter !== null) rules.push({ x: sim.analysis.exactOuter, label: 'turning point' });
    return { rs, series, rules, top: energy > 10 ? Math.ceil((energy + 5) / 10) * 10 : 15 };
  }, [sim, epsilon, sigma]);

  const gapSeries = useMemo(
    (): MdSeries[] => (sim.kind === 'trio' ? [{ key: 'gap', label: 'distance between twins', color: MD_INK, values: sim.gap }] : []),
    [sim]
  );
  const bondSeries = useMemo(
    (): MdSeries[] => (sim.kind === 'cluster' ? [{ key: 'bonds', label: 'starting bonds intact', color: MD_INK, values: sim.bonds }] : []),
    [sim]
  );
  const brokenAway = useMemo(
    () => (sim.kind === 'cluster' ? largestClusterMask(sim.run, frame, ARGON.sigma).map((inside) => !inside) : null),
    [sim, frame]
  );

  const eps = sim.kind === 'pair' ? epsilon : ARGON.epsilon;
  const driftText =
    sim.kind === 'cluster'
      ? `${((100 * run.maxEnergyError) / (eps * run.n)).toFixed(3)}% of ε per atom`
      : `${((100 * run.maxEnergyError) / eps).toFixed(2)}% of ε`;
  const stepFs = sim.kind === 'pair' ? (sim.dt * 1000).toFixed(1) : '10';
  const nudgeLabel = NUDGES.find((o) => o.value === nudgeExp)?.label ?? '';
  const pairTornApart = sim.kind === 'pair' && sim.analysis.energy < 0 && distanceAt(run, last, 0, 1) > 3 * sigma;

  let rows: [string, string][] = [];
  let canvas: React.ReactNode = null;
  let canvasNote = '';
  let charts: React.ReactNode = null;
  let note: React.ReactNode = null;

  if (sim.kind === 'pair' && well) {
    const a = sim.analysis;
    const rNow = distanceAt(run, frame, 0, 1);
    rows = [
      ['Total energy E', `${meV(a.energy)} meV · ${a.bound ? 'bound' : 'free'}`],
      ['r_min = 2^(1/6)σ', `${equilibriumSeparation(sigma).toFixed(3)} nm`],
      ...(a.bound
        ? ([
            ['Turning points, exact', `${a.exactInner.toFixed(3)} – ${(a.exactOuter as number).toFixed(3)} nm`],
            ['Closest – farthest, this run', `${a.runInner.toFixed(3)} – ${a.runOuter.toFixed(3)} nm`],
            ['Period, exact', a.exactPeriod === null ? '—' : `${a.exactPeriod.toFixed(2)} ps`],
            [
              'Period, this run',
              a.runPeriod !== null ? `${a.runPeriod.toFixed(2)} ps` : pairTornApart ? 'none — the pair broke apart' : 'longer than the run',
            ],
          ] as [string, string][])
        : ([
            ['Closest approach, exact', `${a.exactInner.toFixed(3)} nm`],
            ['Closest approach, this run', `${a.runInner.toFixed(3)} nm`],
          ] as [string, string][])),
      ['Energy drift', driftText],
      ['Time step', `${stepFs} fs`],
    ];
    canvas = (
      <MdCanvas
        positions={run.positions}
        n={run.n}
        frame={frame}
        sigma={sigma}
        view={{ cx: 0, cy: 0, half: 0.8 }}
        colors={[ATOMS[0]]}
        caption={`r = ${rNow.toFixed(3)} nm`}
        label="Two atoms moving along a line as they attract and repel"
      />
    );
    canvasNote = 'The pair’s centre of mass stays put; only the separation r changes.';
    charts = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Energy well: U(r) and the total energy E</p>
          <MdChart
            x={well.rs}
            series={well.series}
            title="Potential energy U(r) against separation, with the total energy E as a flat line and the current separation marked"
            xName="separation r"
            xUnit="nm"
            yName="energy"
            yUnit="meV"
            formatY={(v) => meV(v)}
            formatX={shortNumber}
            yDomain={[-22, well.top]}
            rules={well.rules}
            dot={{ x: rNow, y: ljPotential(rNow, epsilon, sigma), color: NOW }}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Energy over time</p>
          <MdChart
            x={run.times}
            series={energySeries}
            title="Kinetic, potential and total energy of the pair over time"
            xName="time"
            xUnit="ps"
            yName="energy"
            yUnit="meV"
            formatY={(v) => meV(v)}
            formatX={shortNumber}
            playhead={frame}
            endLabels
          />
        </div>
      </>
    );
    if (integrator === 'verlet') {
      note = (
        <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
          <span>
            {a.bound ? (
              <>
                E = {meV(a.energy)} meV is below zero, so the pair is bound. Energy conservation alone puts the turning points at{' '}
                {a.exactInner.toFixed(3)} and {(a.exactOuter as number).toFixed(3)} nm
                {a.exactPeriod !== null && <>, one full swing every {a.exactPeriod.toFixed(2)} ps</>}; stepping Newton&apos;s second law
                forward gives {a.runInner.toFixed(3)} and {a.runOuter.toFixed(3)} nm
                {a.runPeriod !== null && <> and {a.runPeriod.toFixed(2)} ps</>}. The same answer both ways — for two atoms, simulation
                isn&apos;t needed.
              </>
            ) : (
              <>
                E = {meV(a.energy)} meV is above zero, so the pair is free. Solving U(r) = E says the atoms get no closer than{' '}
                {a.exactInner.toFixed(3)} nm; this run reaches {a.runInner.toFixed(3)} nm, and then they fly apart, never to return.
              </>
            )}
          </span>
        </p>
      );
    }
  } else if (sim.kind === 'trio') {
    const splitAt = sim.gap.findIndex((g) => g > ARGON.sigma);
    const maxGap = sim.gap.reduce((m, g) => Math.max(m, g), 0);
    rows = [
      ['This run', describe(sim.outcome, duration)],
      [`Twin, nudged ${nudgeLabel}`, describe(sim.twinOutcome, duration)],
      ['Twins an atom-width apart', splitAt >= 0 ? `from t ≈ ${run.times[splitAt].toFixed(0)} ps` : `never, in ${duration} ps`],
      ['Largest gap', `${sci(maxGap)} nm`],
      ['Energy drift', driftText],
    ];
    canvas = (
      <MdCanvas
        positions={run.positions}
        n={run.n}
        frame={frame}
        sigma={ARGON.sigma}
        view={{ cx: -2 * ARGON.sigma, cy: 0, half: 2 }}
        colors={ATOMS}
        labels={TRIO_LABELS}
        ghost={sim.twin.positions}
        trailFrames={60}
        label="A third atom, C, fired at a vibrating pair, A and B, with a twin run drawn as dashed rings"
      />
    );
    canvasNote = 'Solid: this run. Dashed rings: its twin. Trails show the last 3 ps.';
    charts = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Distance between the twins (log scale)</p>
          <MdChart
            x={run.times}
            series={gapSeries}
            title="Distance between the run and its twin over time, on a log scale"
            xName="time"
            xUnit="ps"
            yName="twin gap"
            yUnit="nm"
            formatY={sci}
            formatX={shortNumber}
            log
            yDomain={[1e-10, 10]}
            rules={[{ y: ARGON.sigma, label: 'one atom width, σ' }]}
            playhead={frame}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Energy change since the start</p>
          <MdChart
            x={run.times}
            series={energySeries}
            title="Change in kinetic, potential and total energy of the three atoms since the start"
            xName="time"
            xUnit="ps"
            yName="energy change"
            yUnit="meV"
            formatY={(v) => meV(v)}
            formatX={shortNumber}
            playhead={frame}
            endLabels
          />
        </div>
      </>
    );
    if (integrator === 'verlet') {
      note = (
        <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
          <span className="font-bold">Same forces, same start — almost.</span> The twin&apos;s atom C starts {nudgeLabel} higher,{' '}
          {NUDGE_WORDS[nudgeExp]}.{' '}
          {splitAt >= 0 ? (
            <>
              Once the three atoms tangle, that gap grows by powers of ten (left chart) and passes a whole atom&apos;s width at t ≈{' '}
              {run.times[splitAt].toFixed(0)} ps.{' '}
              {sameEnding(sim.outcome, sim.twinOutcome)
                ? 'Both runs happen to end the same way here, but not at the same moments.'
                : 'By the end, the twins disagree about which atom leaves.'}{' '}
              A nudge a thousand times smaller only buys ten or so more picoseconds — which is why no formula, however clever, can
              predict three atoms far into the future.
            </>
          ) : (
            <>
              Here the twins stay within one atom-width for the whole run: a fast or wide shot is over before small differences can
              grow. Slow shots that get captured are where the chaos shows.
            </>
          )}
        </p>
      );
    }
  } else if (sim.kind === 'cluster') {
    const away = brokenAway ? brokenAway.filter(Boolean).length : 0;
    const settled = meanFrom(sim.temps, Math.floor(run.nFrames * 0.75));
    rows = [
      ['Temperature now', `${Math.round(sim.temps[frame])} K`],
      ['Settles near (last quarter)', `${Math.round(settled)} K`],
      ['Starting bonds intact, now', pctOf(sim.bonds[frame])],
      ['Biggest group, now', `${size - away} of ${size} atoms`],
      ['Behaves like, by the end', PHASE_WORDS[sim.phase]],
      ['Energy drift', driftText],
    ];
    canvas = (
      <MdCanvas
        positions={run.positions}
        n={run.n}
        frame={frame}
        sigma={ARGON.sigma}
        view={{ cx: sim.box / 2, cy: sim.box / 2, half: sim.box * 0.52 }}
        colors={[ATOMS[0]]}
        box={sim.box}
        bondLength={1.35 * ARGON.sigma}
        muted={brokenAway}
        caption={`${size} argon atoms`}
        label={`A cluster of ${size} atoms in a box, with bonds drawn between near neighbours`}
      />
    );
    canvasNote = 'Lines join neighbours closer than 0.46 nm; faded atoms have broken away from the biggest group.';
    charts = (
      <>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Starting bonds still intact</p>
          <MdChart
            x={run.times}
            series={bondSeries}
            title="Share of the starting neighbour bonds still intact over time"
            xName="time"
            xUnit="ps"
            yName="bonds intact"
            yUnit="%"
            formatY={(v) => pctOf(v)}
            formatTick={(v) => String(Math.round(v * 100))}
            formatX={shortNumber}
            yDomain={[0, 1.05]}
            playhead={frame}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Energy change since the start</p>
          <MdChart
            x={run.times}
            series={energySeries}
            title="Change in kinetic, potential and total energy of the cluster since the start"
            xName="time"
            xUnit="ps"
            yName="energy change"
            yUnit="meV"
            formatY={(v) => meV(v, 1)}
            formatX={shortNumber}
            playhead={frame}
            endLabels
          />
        </div>
      </>
    );
    if (integrator === 'verlet') {
      note = (
        <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
          {sim.phase === 'solid' && (
            <>
              <span className="font-bold">Solid-like.</span> Every atom rattles around its own spot, and {pctOf(sim.bondShare)} of the
              starting bonds are still there at the end. Raise the starting temperature to shake it harder.
            </>
          )}
          {sim.phase === 'liquid' && (
            <>
              <span className="font-bold">Liquid-like.</span> Atoms slide past each other and swap neighbours — only{' '}
              {pctOf(sim.bondShare)} of the starting bonds survive — yet a drop of {sim.largest} atoms holds together
              {sim.largest < size ? `, while ${size - sim.largest} have broken away` : ''}.
            </>
          )}
          {sim.phase === 'gas' && (
            <>
              <span className="font-bold">Gas-like.</span> The bonds are gone and the atoms spread through the box; the biggest group
              left is {sim.largest} atoms.
            </>
          )}{' '}
          The temperature settles near {Math.round(settled)} K, well below the {temperature} K you started with: stretching and breaking
          bonds soaks up energy, so kinetic energy turns into potential energy while the total stays flat.
        </p>
      );
    }
  }

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Bubbles className="w-5 h-5 text-gold-hover" />
        <span>Molecular dynamics simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Every atom feels the Lennard-Jones force from every other atom; the forces add, Newton&apos;s second law turns them into
        accelerations, and every atom takes a 10-femtosecond step — the loop from &ldquo;How a simulation thinks&rdquo;. The atoms are
        argon (σ = 0.34 nm, ε = 10.3 meV), kept to a flat sheet so you can watch every one.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-2 space-y-2">
          {canvas}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={play.toggle}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
            >
              {play.playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {play.playing ? 'Pause' : play.finished ? 'Replay' : 'Play'}
            </button>
            {sim.kind === 'cluster' && (
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
              >
                <Dices className="w-3 h-3" />
                New random speeds
              </button>
            )}
            <span className="font-mono text-[10px] text-deepteal-soft ml-auto">t = {run.times[frame].toFixed(1)} ps</span>
          </div>
          <input
            type="range"
            min={0}
            max={playSeconds}
            step={0.01}
            value={play.t}
            onChange={(e) => play.seek(parseFloat(e.target.value))}
            className="w-full accent-gold cursor-pointer"
            aria-label="Scrub through the run"
            aria-valuetext={`${run.times[frame].toFixed(1)} ps`}
          />
          <p className="font-mono text-[10px] text-deepteal-soft">{canvasNote}</p>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Setup</p>
            <Segmented options={SCENARIOS} value={scenario} onChange={setScenario} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Step rule</p>
            <Segmented options={INTEGRATORS} value={integrator} onChange={setIntegrator} />
          </div>

          {scenario === 'pair' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Slider label="Well depth ε" value={epsilon} min={5} max={20} step={0.1} unit="meV" digits={1} onChange={setEpsilon} />
                <Slider label="Atom size σ" value={sigma} min={0.25} max={0.45} step={0.01} unit="nm" digits={2} onChange={setSigma} />
                <Slider label="Starting separation" value={r0Eff} min={r0Min} max={1} step={0.01} unit="nm" digits={2} onChange={setR0} />
                <Slider label="Closing speed" value={push} min={-300} max={500} step={10} unit="m/s" onChange={setPush} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEpsilon(ARGON.epsilon);
                    setSigma(ARGON.sigma);
                  }}
                  disabled={epsilon === ARGON.epsilon && sigma === ARGON.sigma}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors disabled:opacity-50 disabled:hover:border-sage"
                >
                  <RotateCcw className="w-3 h-3" />
                  Back to argon
                </button>
                <span className="text-[11px] text-deepteal-soft">Negative closing speed: the atoms start moving apart.</span>
              </div>
            </>
          )}

          {scenario === 'trio' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Slider label="Closing speed of C" value={speed} min={20} max={300} step={10} unit="m/s" onChange={setSpeed} />
                <Slider label="Aim, off-centre" value={aim} min={0} max={0.3} step={0.01} unit="nm" digits={2} onChange={setAim} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Twin nudged by</p>
                <Segmented options={NUDGES} value={nudgeExp} onChange={setNudgeExp} />
              </div>
            </>
          )}

          {scenario === 'cluster' && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Atoms</p>
                <Segmented options={SIZES.map((s) => ({ value: s, label: String(s) }))} value={size} onChange={setSize} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Starting temperature</p>
                <Segmented options={TEMPERATURES.map((T) => ({ value: T, label: `${T} K` }))} value={temperature} onChange={setTemperature} />
              </div>
            </>
          )}

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            {rows.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-deepteal-soft">{k}</dt>
                <dd className="text-deepteal text-right font-bold break-words">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{charts}</div>

      <div className="space-y-2">
        {integrator === 'euler' && (
          <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold">Euler adds a little energy every step.</span>{' '}
              {run.blewUpAt !== null
                ? `Here the total energy ran away, so the run was stopped at ${run.blewUpAt.toFixed(run.blewUpAt < 10 ? 1 : 0)} ps.`
                : `Here the total energy wandered by ${driftText}${pairTornApart ? ' — enough to tear the bound pair apart' : ''}.`}{' '}
              Velocity Verlet uses the same forces and the same {stepFs} fs step, but splits each velocity update around the move, and
              holds the energy steady.
            </span>
          </p>
        )}
        {note}
      </div>
    </div>
  );
};
