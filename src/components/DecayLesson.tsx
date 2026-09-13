import React from 'react';
import { Cpu, Dices, FlaskConical, Gauge, Hourglass, Radiation, Ruler, Sigma } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { DecaySimulator } from './DecaySimulator';
import { DecayInstrumentWidget } from './DecayInstrumentWidget';

const DECAY_QUESTIONS: QuizQuestion[] = [
  {
    id: 'rd1',
    prompt: 'A single radioactive atom sits in front of you. Can you predict the exact moment it will decay?',
    options: [
      { id: 'a', text: 'Yes, precisely, if you know its half-life' },
      { id: 'b', text: 'No, only the probability that it decays within a given time' },
      { id: 'c', text: 'No, decay is completely unpredictable even statistically' },
    ],
    correctId: 'b',
    explanation:
      "A single atom's decay is random, but not lawless: the half-life sets the odds. A given atom has a 50% chance of decaying within one half-life — you just can't know which 50% of the atoms it will be.",
  },
  {
    id: 'rd2',
    prompt: 'A large sample starts with N₀ atoms. After one half-life has passed, how many remain, on average?',
    options: [
      { id: 'a', text: 'All of them' },
      { id: 'b', text: 'About half of them' },
      { id: 'c', text: 'None of them' },
    ],
    correctId: 'b',
    explanation:
      'About half — that is exactly what a half-life means. A large sample lands very close to one half; a small one can wander noticeably either side of it, as Part 5 shows.',
  },
  {
    id: 'rd3',
    prompt:
      'The atoms in your sample decay into a new radioactive isotope, which then decays again into a third, stable isotope. Compared to a single decay step, predicting the amount of each isotope over time is:',
    options: [
      { id: 'a', text: 'Just as simple, since each step follows the same formula' },
      { id: 'b', text: 'Somewhat simpler, since the steps average out' },
      { id: 'c', text: 'Noticeably more complex' },
    ],
    correctId: 'c',
    explanation:
      'Each step still follows its own simple rule, but the middle isotope is being created and destroyed at the same time, so its amount depends on both rates at once. That is a decay chain, and it is where simulation starts to earn its keep.',
  },
];

const CONTENTS = [
  { id: 'rd-part-1', label: 'Describing a radioactive sample' },
  { id: 'rd-part-2', label: 'The principle of proportional decay' },
  { id: 'rd-part-3', label: 'Building the mathematical model' },
  { id: 'rd-part-4', label: 'Different half-lives' },
  { id: 'rd-part-5', label: 'Why equations eventually fail' },
  { id: 'rd-part-6', label: 'How a simulation thinks' },
  { id: 'rd-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe a radioactive sample using the number of atoms, the decay constant, and the half-life.',
  'Explain how individually random decays add up to a smooth, predictable curve.',
  'Derive N(t) = N₀e^(−λt) and connect the decay constant to the half-life.',
  'Predict how samples with different half-lives behave, alone and mixed together.',
  'Recognize why decay chains, small samples, and mixed sources push past a single formula.',
  'Build the per-atom, random-number loop a real decay simulation runs.',
];

const HALF_LIFE_TABLE = [
  // The source PDF heads this column "Result after one half-life", but after
  // exactly one half-life every isotope has half its atoms left. The rows
  // describe what you observe on everyday timescales, so the column says that.
  { halfLife: 'Very short (seconds)', result: 'Nearly all atoms decay almost immediately' },
  { halfLife: 'Medium (days to years)', result: 'Half remain after each half-life, following the same smooth curve' },
  { halfLife: 'Very long (thousands of years)', result: 'The sample appears almost unchanged on human timescales' },
  { halfLife: 'Two isotopes mixed together', result: 'Each follows its own curve, added together' },
];

const ASSUMPTIONS = [
  'Exactly one isotope',
  'A single fixed decay constant',
  'A very large number of atoms',
  'No new atoms being produced',
  'No new radioactive products created by the decay',
];

const APPLICATIONS = [
  'Nuclear reactor fuel and waste management',
  'Radiometric dating of rocks, fossils, and artifacts',
  'Nuclear medicine dosimetry and treatment planning',
  'Radiation shielding and safety design',
  'Modeling cosmic-ray-produced isotopes in the atmosphere',
];

const SIM_STEPS = [
  { code: 'p = 1 − e^(−λΔt)', label: "Look up the decay probability for the atom's current isotope over one small time step" },
  { code: 'r = random()', label: 'Draw a random number and compare it to that probability' },
  { code: 'if r < p: → daughter', label: 'If it decays, convert the atom to its daughter isotope (or remove it, if the daughter is stable)' },
  { code: 'else: unchanged', label: 'Leave the atom unchanged otherwise' },
  { code: 't += Δt, every atom', label: 'Advance time by a small step, and repeat for every atom, every step' },
];

export const DecayLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Radiation className="w-4 h-4 text-gold-hover" />
          <span>Lesson 9 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Radioactive decay — when do we need simulation?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine a jar containing a trillion identical radioactive atoms. You cannot say which atom
                will decay next, or exactly when — each one seems to make up its own mind, at a random
                moment. And yet, if you count how many atoms remain every hour, the jar as a whole behaves
                with almost perfect predictability, tracing a smooth curve every time. Simple enough to
                picture — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>Why is a single atom's decay unpredictable, while a jar full of them is so predictable?</li>
                <li>Can you say exactly how many atoms will be left after any given time?</li>
                <li>What if the decay produces a new, different radioactive atom, which then decays again?</li>
                <li>What if the jar started with only a handful of atoms instead of a trillion?</li>
                <li>What if two different radioactive substances were mixed together in the same jar?</li>
              </ul>
              <p className="font-bold text-deepteal">Suddenly, the problem becomes more interesting.</p>
            </div>
            <div className="bg-cream-card border border-sage rounded-xl p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2">
                Learning goals
              </p>
              <ul className="space-y-1 text-sm text-deepteal-soft">
                {GOALS.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lg:col-span-5">
            <DecayInstrumentWidget />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <nav className="lg:sticky lg:top-20 bg-cream-card border border-sage rounded-xl p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2.5">
              Contents
            </p>
            <ol className="space-y-1 text-xs font-sans">
              {CONTENTS.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="flex gap-2 text-deepteal-soft hover:text-gold-hover transition-colors py-0.5">
                    <span className="font-mono text-[10px] text-sage-dark shrink-0 pt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{c.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <PreLessonQuiz
            questions={DECAY_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card id="rd-part-1" eyebrow="Part 1" title="Describing a radioactive sample" icon={<Ruler className="w-5 h-5 text-gold-hover" />}>
            <p>
              Every radioactive sample in this lesson is described by how many atoms it has left, and how
              likely each atom is to decay.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Number of atoms</p>
                <p className="text-xs">
                  How many undecayed atoms remain at a given time. Written <MathFormula latex="N" />.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Decay constant</p>
                <p className="text-xs">
                  The probability per unit time that any single atom decays. Written{' '}
                  <MathFormula latex={String.raw`\lambda`} />, units per second (s⁻¹).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Half-life</p>
                <p className="text-xs">
                  The time it takes for half of a sample to decay, on average. Written{' '}
                  <MathFormula latex="T_{1/2}" />.
                </p>
              </div>
            </div>
          </Card>

          <Card id="rd-part-2" eyebrow="Part 2" title="The principle of proportional decay" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
            <p>
              Individually, each atom's decay is random — a coin flip with fixed odds, repeated every
              instant. But physics gives us a remarkably simple rule for the group as a whole: the number
              of decays happening right now is proportional to the number of atoms still present.
            </p>
            <Eq latex={String.raw`\frac{dN}{dt} = -\lambda N`} />
            <p className="font-semibold text-deepteal">
              That's it — no atom influences any other atom, and no atom &ldquo;remembers&rdquo; how long it
              has already survived. Each one keeps the same fixed odds of decaying at every instant; you just
              add up the individually random outcomes across the whole population.
            </p>
            <p className="text-xs">
              This single rule is what turns unpredictable individual atoms into a smooth, predictable curve
              for the sample as a whole.
            </p>
          </Card>

          <Card id="rd-part-3" eyebrow="Part 3" title="Building the mathematical model" icon={<Gauge className="w-5 h-5 text-gold-hover" />}>
            <p className="font-semibold text-deepteal">Step 1 — One isotope, one decay constant</p>
            <p className="text-xs">
              Suppose a sample starts with <MathFormula latex="N_0" /> atoms of a single isotope, each
              decaying with the same constant <MathFormula latex={String.raw`\lambda`} />.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — Solve the equation</p>
            <p className="text-xs">
              Solving the proportional decay equation gives an exact, closed-form result for the number of
              atoms remaining at any time <MathFormula latex="t" />:
            </p>
            <Eq latex={String.raw`N(t) = N_0\,e^{-\lambda t}`} />
            <SymbolTable
              rows={[
                { symbol: 'N_0', meaning: 'Number of atoms at time t = 0' },
                { symbol: String.raw`\lambda`, meaning: 'Decay constant of the isotope' },
                { symbol: 't', meaning: 'Elapsed time' },
                { symbol: 'N(t)', meaning: 'Number of atoms remaining at time t' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — Connecting to half-life</p>
            <p className="text-xs">
              Setting <MathFormula latex="N(t)" /> equal to half of <MathFormula latex="N_0" /> and solving
              for <MathFormula latex="t" /> gives the half-life in terms of the decay constant:
            </p>
            <Eq latex={String.raw`\tfrac{1}{2} = e^{-\lambda T_{1/2}} \quad\Longrightarrow\quad T_{1/2} = \frac{\ln 2}{\lambda}`} />
            <p className="text-xs">
              A short half-life means a large <MathFormula latex={String.raw`\lambda`} /> and fast decay; a long
              half-life means a small <MathFormula latex={String.raw`\lambda`} /> and slow decay. Either way, the
              same exponential curve describes the whole population.
            </p>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Worked example</p>
              <p className="text-xs">
                A sample starts with <MathFormula latex="N_0 = 1{,}000{,}000" /> atoms of an isotope with a
                half-life of 10 days. How many remain after 25 days?
              </p>
              <p className="font-mono text-xs text-deepteal">λ = ln(2) / 10 ≈ 0.0693 per day</p>
              <p className="font-mono text-xs text-deepteal">N(25) = 1,000,000 × e^(−0.0693 × 25) ≈ 1,000,000 × 0.177</p>
              <p className="font-mono text-xs text-deepteal font-bold">≈ 177,000 atoms remain</p>
              <p className="text-xs italic">
                25 days is two and a half half-lives, so this is 2^(−2.5) of the sample — about 17.7%.
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For a single isotope with a large number of
                atoms, we have an exact formula for how many remain at any time. Scientists use simulation when
                simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card id="rd-part-4" eyebrow="Part 4" title="Different half-lives" icon={<Hourglass className="w-5 h-5 text-gold-hover" />}>
            <p>The equation remains the same. Only the value of λ changes.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Half-life</th>
                    <th className="text-left py-2 font-bold">What you observe</th>
                  </tr>
                </thead>
                <tbody>
                  {HALF_LIFE_TABLE.map((row) => (
                    <tr key={row.halfLife} className="border-b border-sage/30 align-top">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.halfLife}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs italic">
              After exactly one half-life, every row has half its atoms left — that is what a half-life means.
              What changes from row to row is how long that takes.
            </p>
            <Predict
              items={[
                'Why does radiocarbon dating work well for objects thousands of years old, but not for objects only a few years old?',
                'What happens to the curve if you start counting a jar that already had some atoms decay before you began watching?',
                'Why might doctors choose a short-half-life isotope for a medical scan, rather than a long-half-life one?',
              ]}
            />
            <p className="text-xs italic">Think before revealing the answer — then use the simulator below to check yourself.</p>
          </Card>

          <DecaySimulator />

          <Card id="rd-part-5" eyebrow="Part 5" title="Why equations eventually fail" icon={<Cpu className="w-5 h-5 text-gold-hover" />}>
            <p>So far, we have assumed:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ASSUMPTIONS.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p>Real radioactive samples are usually far messier.</p>

            <p className="font-semibold text-deepteal pt-1">Decay chains</p>
            <p>
              Many isotopes don't decay into a stable, inert atom — they decay into another radioactive
              isotope, which decays into another, and so on, sometimes through a dozen or more steps before
              reaching stability. Each step in the chain has its own decay constant, and the amount of any one
              isotope in the chain depends on how fast it's being created by the step before it, and how fast
              it's decaying into the step after it.
            </p>

            <p className="font-semibold text-deepteal pt-1">Small samples and mixed sources</p>
            <p>
              The smooth exponential curve only emerges because huge numbers of random individual decays
              average out. With only a handful of atoms — a single decaying nucleus in a detector, for example —
              moment-to-moment counts fluctuate noticeably, and the smooth formula stops matching what's
              actually observed. Real samples are also often mixtures of several isotopes at once, each
              contributing its own curve.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Why simulation helps</p>
              <p className="text-xs">
                Once decay chains, small-number statistics, and mixed isotopes are all involved at once, no
                single formula captures the whole picture:
              </p>
              <ul className="space-y-0.5 text-xs">
                {[
                  'Each atom has its own fixed odds of decaying at every instant.',
                  'A decaying atom may become a new, different radioactive atom, which starts the process over again.',
                  'Every isotope in the chain gains atoms from the step before it and loses atoms to the step after it.',
                  'With small samples, the random nature of each individual decay actually matters, not just the average.',
                ].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs">
                This feedback loop across many isotopes and many individually random atoms quickly becomes
                difficult to solve analytically for a full chain. A simulation handles it naturally by testing
                each atom's fate at every small time step.
              </p>
            </div>
          </Card>

          <Card id="rd-part-6" eyebrow="Part 6" title="How a simulation thinks" icon={<Dices className="w-5 h-5 text-gold-hover" />}>
            <p>
              Instead of solving everything at once, the computer repeatedly performs, for every atom in the
              sample — the same loop the simulator above and the Python lab below run:
            </p>
            <ol className="space-y-1.5">
              {SIM_STEPS.map((s, i) => (
                <li key={s.label} className="flex items-baseline gap-3 bg-cream border border-sage/60 rounded-lg px-3 py-2">
                  <span className="font-mono text-[10px] font-bold text-gold-hover shrink-0">{i + 1}</span>
                  <span className="text-xs text-deepteal-soft flex-1">{s.label}</span>
                  <code className="font-mono text-[11px] text-deepteal whitespace-nowrap">{s.code}</code>
                </li>
              ))}
            </ol>
            <p className="font-semibold text-deepteal">
              The familiar smooth decay curves, and the messier fluctuations in small samples, both emerge
              naturally from these small random steps.
            </p>
          </Card>

          <Card id="rd-part-7" eyebrow="Part 7" title="Real-world applications" icon={<FlaskConical className="w-5 h-5 text-gold-hover" />}>
            <p className="text-xs">Radioactive decay simulations are used in:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {APPLICATIONS.map((a) => (
                <li key={a} className="bg-cream border border-sage/60 rounded-lg px-3 py-2 text-xs text-deepteal-soft">
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

export const DecayLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">Key takeaway</p>
    <p className="text-sm text-sage-light leading-relaxed">
      A single isotope with a large number of atoms can be described with one exact formula — the amount
      remaining depends cleanly on the decay constant and elapsed time.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula latex={String.raw`N(t) = N_0\,e^{-\lambda t} \qquad T_{1/2} = \frac{\ln 2}{\lambda}`} block className="text-cream" />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Decay chains, small-number statistics, and mixed isotopes quickly become too complex to solve
      analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
