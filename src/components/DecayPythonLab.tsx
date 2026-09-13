import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Play, RotateCcw, Terminal } from 'lucide-react';
import { DecayChart, DecaySeries, DECAY_MUTED, DECAY_SLOTS } from './DecayChart';
import { batemanChain } from '../utils/decayEngine';

const DEFAULT_CODE = `# Radioactive decay, one atom at a time.
# Every step, every atom rolls a random number against its chance of decaying.

import math
import random

random.seed(1)   # change the seed for a fresh set of random numbers

# Each isotope: its half-life in days (None = stable) and what it decays into.
# Challenge 2: point "A" at a radioactive daughter, e.g. "B" with a 3-day half-life.
ISOTOPES = {
    "A":      {"half_life": 10.0, "daughter": "stable"},
    "stable": {"half_life": None, "daughter": None},
}

START = {"A": 1000}   # atoms of each isotope at t = 0 (challenge 4: try 30)
DAYS = 50.0           # how long to watch
DT = 0.5              # time step, days

def decay_probability(half_life, dt):
    """Chance that one atom of this isotope decays within one time step."""
    lam = math.log(2) / half_life
    return 1 - math.exp(-lam * dt)

def step(atoms, dt):
    """Advance every atom by one step. atoms[i] is the name of atom i's isotope."""
    for i, name in enumerate(atoms):
        iso = ISOTOPES[name]
        if iso["half_life"] is not None and random.random() < decay_probability(iso["half_life"], dt):
            atoms[i] = iso["daughter"]
`;

interface LabOutput {
  dt: number;
  steps: number;
  isotopes: Record<string, { halfLife: number | null; daughter: string | null }>;
  start: Record<string, number>;
  counts: Record<string, number[]>;
  probabilities: Record<string, number>;
}

interface Analysis {
  times: Float64Array;
  series: DecaySeries[];
  /** Whether the exact curves could be built (every chain straight, no cycles). */
  exactAvailable: boolean;
  hasChain: boolean;
  nonExactRule: string[];
  folded: number;
  parent: { name: string; halfLife: number; simulated: number; expected: number; atStep: number } | null;
}

function analyse(out: LabOutput): Analysis {
  const times = Float64Array.from({ length: out.steps + 1 }, (_, s) => s * out.dt);
  const names = Object.keys(out.isotopes);
  const radioactive = names.filter((n) => out.isotopes[n].halfLife !== null && out.counts[n]?.some((c) => c > 0));

  // Exact curves: follow each starting isotope down its chain and add Bateman's answer.
  const expected: Record<string, Float64Array> = {};
  let exactAvailable = true;
  let hasChain = false;
  for (const [startName, n0] of Object.entries(out.start)) {
    const chain: string[] = [];
    const seen = new Set<string>();
    let cur: string | null = startName;
    while (cur !== null && out.isotopes[cur] && out.isotopes[cur].halfLife !== null) {
      if (seen.has(cur)) {
        exactAvailable = false;
        break;
      }
      seen.add(cur);
      chain.push(cur);
      cur = out.isotopes[cur].daughter;
    }
    if (cur !== null && !out.isotopes[cur]) exactAvailable = false;
    if (!exactAvailable) break;
    if (chain.length > 1) hasChain = true;
    const halfLives = chain.map((c) => out.isotopes[c].halfLife as number);
    for (let s = 0; s <= out.steps; s++) {
      const values = batemanChain(halfLives, n0, times[s]);
      chain.forEach((c, k) => {
        expected[c] ??= new Float64Array(out.steps + 1);
        expected[c][s] += values[k];
      });
    }
  }

  const series: DecaySeries[] = radioactive.map((name, i) => ({
    key: name,
    label: `${name} · T½ ${out.isotopes[name].halfLife} d`,
    color: i < DECAY_SLOTS.length ? DECAY_SLOTS[i] : DECAY_MUTED,
    simulated: out.counts[name],
    expected: exactAvailable ? expected[name] : undefined,
  }));

  const nonExactRule = Object.entries(out.probabilities)
    .filter(([name, p]) => {
      const exact = 1 - Math.exp((-Math.LN2 / (out.isotopes[name].halfLife as number)) * out.dt);
      return Math.abs(p - exact) > 1e-9;
    })
    .map(([name]) => name);

  const firstStart = Object.keys(out.start)[0];
  let parent: Analysis['parent'] = null;
  if (firstStart && exactAvailable && out.isotopes[firstStart]?.halfLife) {
    const halfLife = out.isotopes[firstStart].halfLife as number;
    const atStep = Math.round(halfLife / out.dt);
    if (atStep <= out.steps) {
      parent = { name: firstStart, halfLife, simulated: out.counts[firstStart][atStep], expected: expected[firstStart][atStep], atStep };
    }
  }

  return { times, series, exactAvailable, hasChain, nonExactRule, folded: Math.max(0, radioactive.length - DECAY_SLOTS.length), parent };
}

export const DecayPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<LabOutput | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ((window as any).loadPyodide) {
          const py = await (window as any).loadPyodide();
          if (!cancelled) {
            pyodideRef.current = py;
            setIsReady(true);
          }
        }
      } catch (e) {
        console.warn('Pyodide unavailable; the decay lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async () => {
    setError('');
    setIsRunning(true);
    const py = pyodideRef.current;
    if (!py) {
      setError('Python is still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    const runner = `
${code}

import json

def __run_decay():
    atoms = []
    for name, n in START.items():
        if name not in ISOTOPES:
            raise ValueError(f"START names {name!r}, which is not in ISOTOPES.")
        atoms.extend([name] * int(n))
    if not atoms:
        raise ValueError("START has no atoms.")
    steps = int(round(DAYS / DT))
    names = list(ISOTOPES)
    counts = {name: [0] * (steps + 1) for name in names}
    def tally(s):
        for name in atoms:
            counts[name][s] += 1
    tally(0)
    for s in range(1, steps + 1):
        step(atoms, DT)
        tally(s)
    return json.dumps({
        "dt": DT,
        "steps": steps,
        "isotopes": {n: {"halfLife": ISOTOPES[n]["half_life"], "daughter": ISOTOPES[n]["daughter"]} for n in names},
        "start": {n: int(v) for n, v in START.items()},
        "counts": counts,
        "probabilities": {n: decay_probability(ISOTOPES[n]["half_life"], DT) for n in names if ISOTOPES[n]["half_life"] is not None},
    })
__run_decay()
`;

    try {
      // A fresh namespace for every run. Pyodide otherwise keeps one global
      // namespace for the whole page, so a function renamed or deleted in the
      // editor would keep running from the previous run.
      const namespace = py.globals.get('dict')();
      let json: string;
      try {
        json = await py.runPythonAsync(runner, { globals: namespace });
      } finally {
        namespace.destroy();
      }
      setOutput(JSON.parse(json));
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  const analysis = useMemo(() => (output ? analyse(output) : null), [output]);
  const totalAtoms = output ? Object.keys(output.start).reduce((sum, name) => sum + output.start[name], 0) : 0;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — one random number per atom</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">{isReady ? 'Pyodide ready' : 'Loading Python…'}</span>
      </div>

      <p className="text-sm text-deepteal-soft">
        This is the lesson&apos;s loop, written out: <code className="font-mono text-xs">step(atoms, dt)</code> visits every atom,
        rolls <code className="font-mono text-xs">random.random()</code> against{' '}
        <code className="font-mono text-xs">decay_probability(half_life, dt)</code>, and turns decayed atoms into their daughter. Edit{' '}
        <code className="font-mono text-xs">ISOTOPES</code> and <code className="font-mono text-xs">START</code> for every challenge — a
        chain is a daughter that has its own half-life; a mixture is two entries in <code className="font-mono text-xs">START</code>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={22}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Radioactive decay simulation code"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={run}
              disabled={isRunning}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-gold text-deepteal font-bold hover:bg-gold-hover transition-colors disabled:opacity-60"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Running' : 'Run simulation'}
            </button>
            <button
              onClick={() => {
                setCode(DEFAULT_CODE);
                setError('');
              }}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset code
            </button>
            {output && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {totalAtoms.toLocaleString('en-US')} atoms · {output.steps} steps · real Python
              </span>
            )}
          </div>
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed overflow-x-auto">{error}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {output && analysis && !error ? (
            <>
              <DecayChart
                times={analysis.times}
                series={analysis.series}
                halfLife={analysis.series.length === 1 ? analysis.parent?.halfLife : undefined}
                title="Atoms remaining in your simulation, with the exact formula dashed"
              />
              {analysis.parent && (
                <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
                  <span>
                    After one half-life ({analysis.parent.halfLife} d) your run has {analysis.parent.simulated.toLocaleString('en-US')} atoms
                    of {analysis.parent.name}; the exact formula expects {Math.round(analysis.parent.expected).toLocaleString('en-US')}.
                  </span>
                </p>
              )}
              {analysis.hasChain && (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    In this loop, an atom that decays can&apos;t decay again as its daughter until the next step, so daughters read a few
                    percent above the dashed curve at DT = {output.dt}. Halve DT and watch the gap close — the simulator above uses an exact
                    rule that hands the daughter the rest of the step.
                  </span>
                </p>
              )}
              {analysis.nonExactRule.length > 0 && (
                <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
                  Your decay_probability isn&apos;t the exact chance 1 − e^(−λΔt) for {analysis.nonExactRule.join(', ')} — if it&apos;s λΔt,
                  expect the curve to fall a little too fast when DT is coarse.
                </p>
              )}
              {!analysis.exactAvailable && (
                <p className="text-xs text-deepteal-soft italic">No exact curve drawn: a chain in ISOTOPES loops back on itself or names a missing isotope.</p>
              )}
              {analysis.folded > 0 && (
                <p className="text-xs text-deepteal-soft italic">
                  {analysis.folded} more radioactive isotope{analysis.folded > 1 ? 's are' : ' is'} drawn in muted grey — three colours
                  is the most a chart can keep apart reliably.
                </p>
              )}
            </>
          ) : (
            <div className="aspect-[4/3] rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">Run the code to count what happens to every atom.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
