import React from 'react';
import { Bubbles, Cpu, FlaskConical, Gauge, RefreshCw, Ruler, Shapes, Sigma } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { MdSimulator } from './MdSimulator';
import { MdInstrumentWidget } from './MdInstrumentWidget';

const MD_QUESTIONS: QuizQuestion[] = [
  {
    id: 'md1',
    prompt: 'Two atoms start far apart and drift toward each other under their mutual attraction. As they get very close together, what happens?',
    options: [
      { id: 'a', text: 'They keep attracting more and more strongly forever' },
      { id: 'b', text: 'The attraction turns into a strong repulsion' },
      { id: 'c', text: 'The force suddenly disappears' },
    ],
    correctId: 'b',
    explanation:
      'The attraction only wins at a distance. Closer than r_min = 2^(1/6)σ the (σ/r)¹² repulsion takes over, and it climbs so steeply that atoms effectively cannot overlap — which is why solids and liquids resist being squeezed.',
  },
  {
    id: 'md2',
    prompt: 'Exactly two atoms, interacting only with each other in empty space. Can their motion be solved exactly, using pen-and-paper methods?',
    options: [
      { id: 'a', text: 'Yes, always' },
      { id: 'b', text: 'No, never' },
      { id: 'c', text: 'Only if they happen to start at rest' },
    ],
    correctId: 'a',
    explanation:
      'Yes, always. Two atoms reduce to a single variable, their separation r, and conservation of energy pins that motion down exactly — whether they start at rest or moving, bound together or free.',
  },
  {
    id: 'md3',
    prompt: 'You add a third atom to the same system, so all three interact with each other. Compared to the two-atom case, solving for the exact motion is:',
    options: [
      { id: 'a', text: 'Just as easy, since the same force law applies' },
      { id: 'b', text: 'Somewhat easier, since the atoms share the work' },
      { id: 'c', text: 'Fundamentally harder — often impossible to solve exactly at all' },
    ],
    correctId: 'c',
    explanation:
      'Fundamentally harder. With three atoms there is no single variable left to reduce to, and no general closed-form solution — the same three-body problem that shows up for planets. The motion can even be chaotic, as the simulator below shows.',
  },
];

const CONTENTS = [
  { id: 'md-part-1', label: 'Describing interacting atoms' },
  { id: 'md-part-2', label: 'One governing rule' },
  { id: 'md-part-3', label: 'Building the mathematical model' },
  { id: 'md-part-4', label: 'Different pairs' },
  { id: 'md-part-5', label: 'Why equations eventually fail' },
  { id: 'md-part-6', label: 'How a simulation thinks' },
  { id: 'md-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe a pair of atoms by their separation, potential energy U(r), and force F = −dU/dr.',
  'Read the Lennard-Jones potential: short-range repulsion, longer-range attraction, and what ε and σ control.',
  'Find the equilibrium separation r_min = 2^(1/6)σ and the depth of the bond, −ε.',
  'Use the total energy to tell a bound pair from a free one, and find its turning points.',
  'Recognize why three atoms, and the huge numbers in real materials, have no exact solution.',
  'Build the force, acceleration, small-step loop a molecular dynamics simulation runs.',
];

const PAIR_TABLE = [
  { change: 'Larger ε (deeper well)', result: 'Stronger bond, stiffer oscillation around r_min' },
  { change: 'Larger σ (bigger atoms)', result: 'Larger equilibrium separation' },
  { change: 'Total energy below zero', result: 'Atoms stay bound, oscillating indefinitely' },
  { change: 'Total energy above zero', result: 'Atoms approach once, then scatter apart forever' },
];

const ASSUMPTIONS = [
  'Exactly two atoms',
  'No outside influences',
  'A known, fixed interaction law',
  'Motion that reduces to a single variable',
  'No bonds breaking or forming beyond the simple two-body picture',
];

const APPLICATIONS = [
  'Drug design and protein folding research',
  'Materials science, including new alloys and polymers',
  'Nanotechnology and surface science',
  'Understanding friction, lubrication, and wear',
  'Studying how liquids, gases, and solids behave and change phase',
];

const SIM_STEPS = [
  { code: 'F(rᵢⱼ) for every j', label: 'Calculate the pairwise force from every other nearby atom' },
  { code: 'Fᵢ = Σ F(rᵢⱼ)', label: 'Sum all of those forces together to get the total force on the atom' },
  { code: 'aᵢ = Fᵢ / m', label: "Convert the total force to an acceleration using Newton's second law" },
  { code: 'v += aΔt, x += vΔt', label: "Update the atom's velocity and position by a small time step" },
  { code: 't += Δt, every atom', label: 'Repeat for every atom, every step' },
];

export const MdLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Bubbles className="w-4 h-4 text-gold-hover" />
          <span>Lesson 10 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">Molecular dynamics — when do we need simulation?</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine two atoms drifting toward each other in empty space. From a distance they gently attract. Get too close, and
                they suddenly repel instead. Somewhere in between is a comfortable resting distance where the pull and the push exactly
                balance. Simple enough to picture — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>Exactly how far apart will the two atoms settle, and how strongly are they bound together?</li>
                <li>Can you predict their motion precisely, for all time, using nothing but pen and paper?</li>
                <li>What if you added a third atom nearby?</li>
                <li>What if you had a whole box of a trillion atoms, jostling around at room temperature?</li>
                <li>What if the atoms could actually break apart and re-form new bonds?</li>
              </ul>
              <p className="font-bold text-deepteal">Suddenly, the problem becomes more interesting.</p>
            </div>
            <div className="bg-cream-card border border-sage rounded-xl p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2">Learning goals</p>
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
            <MdInstrumentWidget />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <nav className="lg:sticky lg:top-20 bg-cream-card border border-sage rounded-xl p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2.5">Contents</p>
            <ol className="space-y-1 text-xs font-sans">
              {CONTENTS.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="flex gap-2 text-deepteal-soft hover:text-gold-hover transition-colors py-0.5">
                    <span className="font-mono text-[10px] text-sage-dark shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <span>{c.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <PreLessonQuiz
            questions={MD_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card id="md-part-1" eyebrow="Part 1" title="Describing interacting atoms" icon={<Ruler className="w-5 h-5 text-gold-hover" />}>
            <p>
              Every atom in this lesson is described by its mass and position. The interaction between any two atoms is described by how
              their potential energy depends on the distance between them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Separation</p>
                <p className="text-xs">
                  The distance between the centres of two atoms. Written <MathFormula latex="r" />, in metres — for atoms, usually
                  nanometres (1 nm = 10⁻⁹ m).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Potential energy</p>
                <p className="text-xs">
                  The stored energy of the pair, as a function of separation. Written <MathFormula latex="U(r)" />.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Force</p>
                <p className="text-xs">
                  How hard the atoms push or pull on each other: the negative slope of the potential energy curve,{' '}
                  <MathFormula latex={String.raw`F(r) = -\,dU/dr`} />.
                </p>
              </div>
            </div>
            <p>A common and realistic choice for the potential energy is the Lennard-Jones potential:</p>
            <Eq latex={String.raw`U(r) = 4\varepsilon\left[\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]`} />
            <p className="text-xs">
              The <MathFormula latex={String.raw`(\sigma/r)^{12}`} /> term is a short-range repulsion — atoms strongly resist overlapping.
              The <MathFormula latex={String.raw`(\sigma/r)^{6}`} /> term is a longer-range attraction — atoms are gently drawn together
              from a distance. <MathFormula latex={String.raw`\varepsilon`} /> sets how deep the attractive well is, and{' '}
              <MathFormula latex={String.raw`\sigma`} /> sets the atom&apos;s effective size. Taking the slope gives the force:
            </p>
            <Eq latex={String.raw`F(r) = -\frac{dU}{dr} = \frac{24\varepsilon}{r}\left[2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^{6}\right]`} />
            <p className="text-xs">A positive force pushes the atoms apart; a negative force pulls them together.</p>
          </Card>

          <Card id="md-part-2" eyebrow="Part 2" title="One governing rule" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
            <p>
              Just as overlapping waves and overlapping fields simply add, the total force on any one atom in a collection is just the
              sum of the pairwise forces from every other atom, each computed as if the others weren&apos;t there.
            </p>
            <Eq latex={String.raw`\vec F_{\text{total on } i} = \sum_{j \neq i} \vec F(r_{ij})`} />
            <p className="font-semibold text-deepteal">That&apos;s it — no three-way or four-way interactions, just pairs added together.</p>
            <p className="text-xs">
              The one difference from waves and fields is what happens next: Newton&apos;s second law turns each atom&apos;s total force
              into an acceleration, and that acceleration constantly changes the separations that the forces depend on.
            </p>
            <Eq latex={String.raw`\vec a_i = \frac{\vec F_{\text{total on } i}}{m}`} />
          </Card>

          <Card id="md-part-3" eyebrow="Part 3" title="Building the mathematical model" icon={<Gauge className="w-5 h-5 text-gold-hover" />}>
            <p className="font-semibold text-deepteal">Step 1 — Exactly two atoms</p>
            <p className="text-xs">
              Suppose exactly two atoms interact with each other, isolated from everything else. Switching to centre-of-mass and relative
              coordinates reduces the whole problem to the motion of a single effective particle, with the reduced mass
            </p>
            <Eq latex={String.raw`\mu = \frac{m_1 m_2}{m_1 + m_2}`} />
            <p className="text-xs">
              moving under the potential <MathFormula latex="U(r)" />. Because this reduces to one variable,{' '}
              <MathFormula latex="r" />, conservation of energy alone is enough to solve it exactly.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — The equilibrium separation</p>
            <p className="text-xs">
              Setting the force to zero and solving gives the exact resting distance, where attraction and repulsion balance:
            </p>
            <Eq latex={String.raw`F(r_{\min}) = 0 \quad\Longrightarrow\quad r_{\min} = 2^{1/6}\,\sigma \approx 1.12\,\sigma`} />
            <p className="text-xs">
              At this separation the potential energy reaches its minimum value,{' '}
              <MathFormula latex={String.raw`U(r_{\min}) = -\varepsilon`} /> — the depth of the bond.
            </p>
            <SymbolTable
              rows={[
                { symbol: String.raw`\varepsilon`, meaning: 'Depth of the attractive well (bond strength)' },
                { symbol: String.raw`\sigma`, meaning: "Distance scale that sets the atom's effective size" },
                { symbol: 'r', meaning: 'Separation between the two atoms' },
                { symbol: String.raw`r_{\min}`, meaning: 'Equilibrium separation, where the net force is zero' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — Bound or free</p>
            <p className="text-xs">Conservation of energy tells us everything about the possible outcomes for two atoms:</p>
            <ul className="space-y-1 text-xs">
              <li className="flex gap-2">
                <span className="text-gold-hover shrink-0">·</span>
                <span>
                  If the total energy is negative, the atoms are <strong className="text-deepteal">bound</strong>: they oscillate back
                  and forth around <MathFormula latex={String.raw`r_{\min}`} /> forever, like two balls connected by a spring.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-hover shrink-0">·</span>
                <span>
                  If the total energy is positive, the atoms are <strong className="text-deepteal">unbound</strong>: they approach, feel
                  the repulsion up close, and scatter back apart, never to return.
                </span>
              </li>
            </ul>
            <p className="text-xs">The exact turning points of the motion can always be found by solving a single equation in one unknown:</p>
            <Eq latex={String.raw`U(r) = E`} />

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Worked example</p>
              <p className="text-xs">
                Two argon atoms (<MathFormula latex={String.raw`\sigma = 0.34`} /> nm, <MathFormula latex={String.raw`\varepsilon = 10.3`} />{' '}
                meV) are released from rest, 0.50 nm apart. Are they bound, and how far do they swing?
              </p>
              <p className="font-mono text-xs text-deepteal">r_min = 2^(1/6) × 0.34 nm ≈ 0.382 nm</p>
              <p className="font-mono text-xs text-deepteal">E = U(0.50 nm) = 4 × 10.3 × [(0.68)¹² − (0.68)⁶] ≈ −3.67 meV</p>
              <p className="font-mono text-xs text-deepteal">E &lt; 0, so the pair is bound</p>
              <p className="font-mono text-xs text-deepteal font-bold">U(r) = −3.67 meV at r ≈ 0.346 nm and r = 0.500 nm</p>
              <p className="text-xs italic">
                The atoms swing between 0.346 nm and 0.500 nm, and energy conservation even gives the time for one full swing: about
                2.45 ps. The simulator&apos;s &ldquo;Two atoms&rdquo; setup starts from exactly this pair.
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">Do we need simulation yet?</p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For exactly two isolated atoms, the problem reduces to one variable, and
                conservation of energy gives an exact solution for the motion. Scientists use simulation when simpler mathematical
                methods stop working.
              </p>
            </div>
          </Card>

          <Card id="md-part-4" eyebrow="Part 4" title="Different pairs" icon={<Shapes className="w-5 h-5 text-gold-hover" />}>
            <p>
              The equations remain the same. Only the values of <MathFormula latex={String.raw`\varepsilon`} />,{' '}
              <MathFormula latex={String.raw`\sigma`} />, and the total energy change.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Change</th>
                    <th className="text-left py-2 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {PAIR_TABLE.map((row) => (
                    <tr key={row.change} className="border-b border-sage/30 align-top">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.change}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs italic">
              &ldquo;Stiffer&rdquo; is measurable: doubling ε for an argon pair shortens a small vibration from 1.27 ps to 0.90 ps, a
              factor of √2, while a bigger σ moves r_min outward.
            </p>
            <Predict
              items={[
                'Why might a real diatomic molecule, like O₂ or N₂, behave almost exactly like this two-atom picture?',
                'What happens to the exact-solution approach the moment a third atom enters the picture?',
                "Why can even a tiny three-atom system sometimes behave chaotically, with motion that's impossible to predict far into the future?",
              ]}
            />
            <p className="text-xs italic">Think before revealing the answer — then use the simulator below to check yourself.</p>
          </Card>

          <MdSimulator />

          <Card id="md-part-5" eyebrow="Part 5" title="Why equations eventually fail" icon={<Cpu className="w-5 h-5 text-gold-hover" />}>
            <p>So far, we have assumed:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ASSUMPTIONS.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p>Real collections of matter are usually far messier.</p>

            <p className="font-semibold text-deepteal pt-1">Three is already too many</p>
            <p>
              The moment a third atom joins, the reduction to a single variable breaks down. There is no general closed-form solution for
              three or more mutually interacting particles — this is the same three-body problem that shows up in orbital mechanics, and
              it applies just as much to atoms as to planets. Worse, the motion can be chaotic: tiny differences in starting position
              grow explosively over time, so no formula, however clever, can predict the far future exactly.
            </p>

            <p className="font-semibold text-deepteal pt-1">Real materials have enormous numbers of atoms</p>
            <p>
              A cup of water contains roughly 10²⁵ molecules, each pulling and pushing on many neighbours at once. The properties we
              actually care about — pressure, temperature, how a liquid flows, whether a material melts or freezes — are collective
              outcomes of all those individual pairwise forces acting together.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Why simulation helps</p>
              <p className="text-xs">
                Once three or more atoms, and the enormous numbers found in real materials, are all involved at once, no single formula
                captures the whole picture:
              </p>
              <ul className="space-y-0.5 text-xs">
                {[
                  'Each atom feels a pairwise force from every other atom nearby.',
                  'All of those forces add together to give the atom its total force, and its acceleration.',
                  "Every atom's position changes a little, which changes every force again.",
                  'The whole system keeps evolving as time advances, one tiny step at a time.',
                ].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs">
                This feedback loop across every pair of atoms, repeated for every atom, quickly becomes impossible to solve analytically.
                A simulation handles it naturally by updating every atom&apos;s position and velocity in many small time steps.
              </p>
            </div>
          </Card>

          <Card id="md-part-6" eyebrow="Part 6" title="How a simulation thinks" icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}>
            <p>
              Instead of solving everything at once, the computer repeatedly performs, for every atom — the same loop the simulator above
              and the Python lab below run:
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
            <p className="text-xs">
              Step 4 is where the care goes. The simulator and the lab use velocity Verlet: half of the velocity update before the move and
              half after, with fresh forces in between. It costs no extra force calculations, and it keeps the total energy steady over
              millions of steps, where the simplest update, Euler&apos;s, slowly pumps energy in until bound atoms shake themselves apart.
            </p>
            <p className="font-semibold text-deepteal">
              The familiar behaviour of everyday matter — melting, evaporating, flowing, folding — emerges naturally from these small steps,
              repeated for every atom in the system.
            </p>
          </Card>

          <Card id="md-part-7" eyebrow="Part 7" title="Real-world applications" icon={<FlaskConical className="w-5 h-5 text-gold-hover" />}>
            <p className="text-xs">Molecular dynamics simulations are used in:</p>
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

export const MdLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">Key takeaway</p>
    <p className="text-sm text-sage-light leading-relaxed">
      Exactly two isolated atoms reduce to a single variable, and conservation of energy solves their motion exactly.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center overflow-x-auto">
      <MathFormula
        latex={String.raw`U(r) = 4\varepsilon\left[\left(\tfrac{\sigma}{r}\right)^{12} - \left(\tfrac{\sigma}{r}\right)^{6}\right] \qquad r_{\min} = 2^{1/6}\,\sigma`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Three or more mutually interacting atoms, and the enormous numbers of atoms found in real materials, quickly become too complex
      to solve analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
