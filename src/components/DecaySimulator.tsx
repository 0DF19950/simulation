import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Dices, Pause, Play, Radiation, RotateCcw } from 'lucide-react';
import { DecayChart, DecaySeries, DECAY_INK, DECAY_SLOTS } from './DecayChart';
import { DecayJar } from './DecayJar';
import { ChainSpec, StepRule, crossingTime, peakOf, runDecay, survivorSpread } from '../utils/decayEngine';

type Scenario = 'single' | 'chain2' | 'chain3' | 'mixed';

const DURATION = 50; // days
const STEP_COUNTS = { fine: 200, coarse: 20 } as const;
const SIZES = [20, 100, 1000, 10000];
const JAR = 400;
const PLAY_SECONDS = 8;
const EMPTY_ATOM = '#E3D9B5';
const LN2 = Math.LN2;

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'single', label: 'One isotope' },
  { value: 'chain2', label: 'Two-step chain' },
  { value: 'chain3', label: 'Three-step chain' },
  { value: 'mixed', label: 'Mixed sample' },
];

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

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs font-mono mb-1">
        <span className="text-deepteal-soft">{label}</span>
        <span className="text-deepteal font-bold">{value} d</span>
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
      />
    </div>
  );
}

/** Time for a curve to fall to half of its value at `start`. */
function halvingFrom(times: ArrayLike<number>, values: ArrayLike<number>, start: number): number | null {
  const target = values[start] / 2;
  for (let s = start + 1; s < values.length; s++) {
    if (values[s] <= target) {
      const f = (values[s - 1] - target) / (values[s - 1] - values[s]);
      return times[s - 1] + f * (times[s] - times[s - 1]) - times[start];
    }
  }
  return null;
}

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
const count = (v: number) => Math.round(v).toLocaleString('en-US');

export const DecaySimulator: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>('single');
  const [size, setSize] = useState(1000);
  const [tA, setTA] = useState(10);
  const [tB, setTB] = useState(3);
  const [tC, setTC] = useState(1);
  const [tD, setTD] = useState(2);
  const [rule, setRule] = useState<StepRule>('exact');
  const [stepMode, setStepMode] = useState<'fine' | 'coarse'>('fine');
  const [seed, setSeed] = useState(1);
  const [t, setT] = useState(PLAY_SECONDS);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  const chains: ChainSpec[] = useMemo(() => {
    if (scenario === 'single') return [{ halfLives: [tA], initialAtoms: size }];
    if (scenario === 'chain2') return [{ halfLives: [tA, tB], initialAtoms: size }];
    if (scenario === 'chain3') return [{ halfLives: [tA, tB, tC], initialAtoms: size }];
    const half = Math.round(size / 2);
    return [
      { halfLives: [tA], initialAtoms: half },
      { halfLives: [tD], initialAtoms: size - half },
    ];
  }, [scenario, size, tA, tB, tC, tD]);

  const steps = STEP_COUNTS[stepMode];
  const run = useMemo(
    () => runDecay({ chains, duration: DURATION, steps, rule, seed, jarSize: JAR }),
    [chains, steps, rule, seed]
  );

  useEffect(() => {
    setT(0);
    setIsPlaying(true);
  }, [run]);

  useEffect(() => {
    if (!isPlaying) {
      lastRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        setT((prev) => {
          if (prev + dt >= PLAY_SECONDS) {
            setIsPlaying(false);
            return PLAY_SECONDS;
          }
          return prev + dt;
        });
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const frame = Math.round((Math.min(t, PLAY_SECONDS) / PLAY_SECONDS) * steps);

  // Colour follows the isotope: parent slot 1, daughter slot 2, granddaughter
  // slot 3; in a mixture the second isotope takes slot 2. Stable atoms are empty.
  const names = useMemo(() => run.members.map((m) => (scenario === 'mixed' ? ['A', 'D'][m.chain] : ['A', 'B', 'C'][m.position])), [run, scenario]);
  const memberColors = useMemo(
    () => run.members.map((m) => (m.halfLife === null ? null : scenario === 'mixed' ? DECAY_SLOTS[m.chain] : DECAY_SLOTS[m.position])),
    [run, scenario]
  );

  const series: DecaySeries[] = useMemo(() => {
    const out: DecaySeries[] = [];
    run.members.forEach((m, i) => {
      if (m.halfLife === null) return;
      out.push({
        key: `m${i}`,
        label: `${names[i]} · T½ ${m.halfLife} d`,
        color: memberColors[i] as string,
        simulated: run.simulated[i],
        expected: run.expected[i],
      });
    });
    if (scenario === 'mixed') {
      const sim = new Float64Array(steps + 1);
      const exp = new Float64Array(steps + 1);
      run.members.forEach((m, i) => {
        if (m.halfLife === null) return;
        for (let s = 0; s <= steps; s++) {
          sim[s] += run.simulated[i][s];
          exp[s] += run.expected[i][s];
        }
      });
      out.push({ key: 'total', label: 'Total', color: DECAY_INK, simulated: sim, expected: exp });
    }
    return out;
  }, [run, names, memberColors, scenario, steps]);

  // Checks against the exact answers, measured from this run.
  const parentN0 = chains[0].initialAtoms;
  const halfLifeRead = crossingTime(run.times, run.simulated[0], parentN0 / 2);
  const halfStep = Math.round(tA / run.dt);
  const atHalf = halfStep <= steps ? run.simulated[0][halfStep] : null;
  // Enough repeats for a steady estimate of the spread, within a fixed budget of random draws.
  const spreadTrials = Math.round(Math.min(2000, 4e6 / parentN0));
  const spread = useMemo(() => survivorSpread(parentN0, 0.5, spreadTrials, seed + 99), [parentN0, spreadTrials, seed]);
  const simpleHalfLife = run.dt * (Math.log(0.5) / Math.log(1 - Math.min(0.999999, (LN2 / tA) * run.dt)));

  const daughter = scenario === 'chain2' || scenario === 'chain3';
  const peakSim = daughter ? peakOf(run.times, run.simulated[1]) : null;
  const peakExact = daughter ? peakOf(run.times, run.expected[1]) : null;

  const total = scenario === 'mixed' ? series[series.length - 1] : null;
  const laterStart = Math.round(20 / run.dt);
  const halvingEarly = total?.expected ? halvingFrom(run.times, total.expected, 0) : null;
  const halvingLate = total?.expected && laterStart < steps ? halvingFrom(run.times, total.expected, laterStart) : null;

  const small = size <= 100;
  const stableCount = run.members.reduce((sum, m, i) => (m.halfLife === null ? sum + run.simulated[i][steps] : sum), 0);

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Radiation className="w-5 h-5 text-gold-hover" />
        <span>Radioactive decay simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Every atom rolls a random number every step — the loop from &ldquo;How a simulation thinks&rdquo;.
        The jar shows the first {JAR} atoms; the chart counts all of them, with the exact formula dashed
        behind each curve.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-2 space-y-2">
          <DecayJar
            jar={run.jar}
            jarAtoms={run.jarAtoms}
            frame={frame}
            memberColors={memberColors}
            surface="#FBF5DD"
            emptyColor={EMPTY_ATOM}
            label="Jar of atoms, coloured by isotope; empty dots have decayed to a stable atom"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => (t >= PLAY_SECONDS ? (setT(0), setIsPlaying(true)) : setIsPlaying((p) => !p))}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <Dices className="w-3 h-3" />
              New random draw
            </button>
            <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
              t = {run.times[frame].toFixed(1)} d
            </span>
          </div>
          <p className="font-mono text-[10px] text-deepteal-soft">
            {run.totalAtoms > JAR ? `Showing ${JAR} of ${count(run.totalAtoms)} atoms` : `All ${run.totalAtoms} atoms`} · empty = decayed
            to stable ({count(stableCount)} by the end)
          </p>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Sample</p>
            <Segmented options={SCENARIOS} value={scenario} onChange={setScenario} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Atoms</p>
            <Segmented options={SIZES.map((s) => ({ value: s, label: count(s) }))} value={size} onChange={setSize} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Slider label="A half-life" value={tA} min={2} max={20} step={0.5} onChange={setTA} />
            {(scenario === 'chain2' || scenario === 'chain3') && <Slider label="B half-life" value={tB} min={0.5} max={10} step={0.5} onChange={setTB} />}
            {scenario === 'chain3' && <Slider label="C half-life" value={tC} min={0.25} max={5} step={0.25} onChange={setTC} />}
            {scenario === 'mixed' && <Slider label="D half-life" value={tD} min={0.5} max={10} step={0.5} onChange={setTD} />}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-dark">Step rule</p>
            <Segmented
              options={[
                { value: 'exact' as StepRule, label: 'Exact' },
                { value: 'simple' as StepRule, label: 'Simple λΔt' },
              ]}
              value={rule}
              onChange={setRule}
            />
            <Segmented
              options={[
                { value: 'fine' as const, label: `Δt ${DURATION / STEP_COUNTS.fine} d` },
                { value: 'coarse' as const, label: `Δt ${DURATION / STEP_COUNTS.coarse} d` },
              ]}
              value={stepMode}
              onChange={setStepMode}
            />
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">A half-life, read off this run</dt>
            <dd className="text-deepteal text-right font-bold">{halfLifeRead === null ? '—' : `${halfLifeRead.toFixed(2)} d`} (true {tA} d)</dd>
            <dt className="text-deepteal-soft">A after one half-life</dt>
            <dd className="text-deepteal text-right font-bold">
              {atHalf === null ? '—' : count(atHalf)} (formula {count(parentN0 / 2)})
            </dd>
            <dt className="text-deepteal-soft">Spread over {count(spreadTrials)} fresh samples</dt>
            <dd className="text-deepteal text-right font-bold">
              ±{spread.std.toFixed(1)} (binomial ±{spread.predictedStd.toFixed(1)})
            </dd>
            {peakSim && peakExact && (
              <>
                <dt className="text-deepteal-soft">B peak, this run</dt>
                <dd className="text-deepteal text-right font-bold">
                  {count(peakSim.value)} at {peakSim.time.toFixed(1)} d
                </dd>
                <dt className="text-deepteal-soft">B peak, Bateman formula</dt>
                <dd className="text-deepteal text-right font-bold">
                  {count(peakExact.value)} at {peakExact.time.toFixed(1)} d
                </dd>
              </>
            )}
            {halvingEarly !== null && (
              <>
                <dt className="text-deepteal-soft">Total halves, from t = 0</dt>
                <dd className="text-deepteal text-right font-bold">{halvingEarly.toFixed(1)} d</dd>
                <dt className="text-deepteal-soft">Total halves, from t = 20 d</dt>
                <dd className="text-deepteal text-right font-bold">{halvingLate === null ? '—' : `${halvingLate.toFixed(1)} d`}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <DecayChart
        times={run.times}
        series={series}
        playhead={frame}
        halfLife={scenario === 'single' ? tA : undefined}
        title="Atoms remaining over time: this run as solid lines, the exact formula dashed"
      />

      <div className="space-y-2">
        {rule === 'simple' && (
          <p className="bg-red-50 border-l-2 border-red-400 rounded-r-lg p-3 text-xs text-red-700 font-sans flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold">The simple rule bends the answer.</span> With p = λΔt tested once per step, A is expected to
              halve in {simpleHalfLife.toFixed(2)} d instead of {tA} d ({pct(1 - simpleHalfLife / tA)} too fast)
              {daughter ? ', and every newly made daughter has to sit out the step it was born in, so the chain reads high' : ''}.
              Shrink Δt, or switch to the exact rule, and watch it close.
            </span>
          </p>
        )}

        {rule === 'exact' && !small && scenario === 'single' && (
          <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
            <span>
              {count(size)} atoms, each on its own random clock, and the jar still follows N₀e^(−λt): read off the curve, the
              half-life comes out at {halfLifeRead === null ? '—' : `${halfLifeRead.toFixed(2)} d`} against the true {tA} d.
            </span>
          </p>
        )}

        {small && (
          <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
            <span className="font-bold">Small sample.</span> With only {size} atoms, each fresh sample lands somewhere different:
            across {count(spreadTrials)} repeats, the count of A after one half-life spreads by ±{spread.std.toFixed(1)} atoms
            ({pct(spread.std / (parentN0 / 2), 0)} of the expected {count(parentN0 / 2)}), just as the binomial predicts. A trillion
            atoms would spread by less than a millionth. Press &ldquo;New random draw&rdquo; a few times and watch the solid line
            wander around the dashed one.
          </p>
        )}

        {daughter && peakSim && peakExact && rule === 'exact' && (
          <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
            <span className="font-bold">Decay chain.</span> B is created by A and destroyed by its own decay at the same time, so it
            rises and falls — peaking here at {count(peakSim.value)} atoms around {peakSim.time.toFixed(1)} d, against{' '}
            {count(peakExact.value)} at {peakExact.time.toFixed(1)} d from Bateman&apos;s exact formula. That formula exists for a
            straight chain like this one, but it grows unwieldy with every extra step, and it cannot show a small sample&apos;s
            randomness at all.
          </p>
        )}

        {scenario === 'mixed' && halvingEarly !== null && (
          <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
            <span className="font-bold">Mixed sample.</span> Each isotope keeps its own half-life, but their total does not have one:
            it halves in {halvingEarly.toFixed(1)} d at the start, and takes {halvingLate === null ? '—' : `${halvingLate.toFixed(1)} d`}{' '}
            starting from day 20, once the short-lived isotope is mostly gone.
          </p>
        )}
      </div>
    </div>
  );
};
