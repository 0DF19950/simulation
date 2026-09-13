import React from 'react';
import { Cpu, Gauge, Magnet, Radar, RefreshCw, Ruler, Shapes, Sigma } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { AcceleratorSimulator } from './AcceleratorSimulator';
import { AcceleratorInstrumentWidget } from './AcceleratorInstrumentWidget';

const ACCELERATOR_QUESTIONS: QuizQuestion[] = [
  {
    id: 'pa1',
    prompt: 'A single charged particle enters a uniform magnetic field, moving perpendicular to it. What path does it follow?',
    options: [
      { id: 'a', text: 'A straight line' },
      { id: 'b', text: 'A perfect circle' },
      { id: 'c', text: 'A path that spirals outward forever' },
      { id: 'd', text: 'An unpredictable, random path' },
    ],
    correctId: 'b',
    explanation:
      'The magnetic force is always sideways to the motion, so it never changes the speed — only the direction. A sideways force of constant size bends the path into a circle.',
  },
  {
    id: 'pa2',
    prompt: "You double the particle's speed but keep the magnetic field the same. What happens to the radius of its circular path?",
    options: [
      { id: 'a', text: 'The radius shrinks' },
      { id: 'b', text: 'The radius stays the same' },
      { id: 'c', text: 'The radius grows' },
    ],
    correctId: 'c',
    explanation:
      'r = mv/(qB), so the radius is proportional to speed: double v and r doubles. The time per lap stays exactly the same — Part 3, Step 3.',
  },
  {
    id: 'pa3',
    prompt:
      "Instead of one particle, you inject a dense bunch of a billion particles, all with the same charge. Compared to the single-particle case, predicting the bunch's shape over time is:",
    options: [
      { id: 'a', text: 'Just as simple, since every particle follows the same formula' },
      { id: 'b', text: 'Somewhat simpler, since the particles average out' },
      { id: 'c', text: 'Noticeably more complex' },
    ],
    correctId: 'c',
    explanation:
      'Each particle still obeys the same force law, but it also feels the push of every other particle — and those pushes depend on where all billion of them are at once. That is space charge, and it is why beam physicists simulate.',
  },
];

const CONTENTS = [
  { id: 'pa-part-1', label: 'Describing a charged particle in a field' },
  { id: 'pa-part-2', label: 'One governing rule' },
  { id: 'pa-part-3', label: 'Building the mathematical model' },
  { id: 'pa-part-4', label: 'Different particles and fields' },
  { id: 'pa-part-5', label: 'Why equations eventually fail' },
  { id: 'pa-part-6', label: 'How a simulation thinks' },
  { id: 'pa-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe a charged particle in a field using charge, mass, speed, and field strength.',
  'Explain why a magnetic force steers a particle without speeding it up.',
  'Derive the cyclotron radius and period, and see why speed cancels out of the period.',
  'Predict how the path changes with field strength, speed, mass, and charge sign.',
  'Recognize why dense bunches, accelerating cavities, imperfect fields, and radiation push past a single formula.',
  'Build the step-by-step particle push a real beam simulation repeats for every particle.',
];

const CHANGE_TABLE = [
  // The source PDF's first row reads "same period formula", which is easy to take as
  // "same period". T = 2πm/(qB) halves when B doubles.
  { change: 'Stronger magnetic field B', result: 'Smaller radius and a shorter period — both scale as 1/B' },
  { change: 'Higher particle speed v', result: 'Larger radius, but the same period (time per lap)' },
  { change: 'Heavier particle (larger m)', result: 'Larger radius and a longer period' },
  { change: 'Opposite-sign charge', result: 'Same size circle, opposite direction of curving' },
];

const ASSUMPTIONS = [
  'Exactly one particle',
  'A perfectly uniform magnetic field',
  'No other particles nearby',
  'No energy lost to radiation',
  'A fixed, unchanging field',
];

const APPLICATIONS = [
  'Large collider design, such as the Large Hadron Collider',
  'Synchrotron light source design for materials and biology research',
  'Medical proton and ion therapy beam planning',
  'Electron microscope and ion implantation systems',
  'Free-electron laser design',
];

const SIM_STEPS = [
  { code: 'a = (q/m) v × B', label: 'Calculate the force from the guiding and focusing magnets' },
  { code: '+ (q/m) E from the bunch', label: 'Add the force from nearby particles in the same bunch (space charge)' },
  { code: 'v += kick, in the cavity', label: 'Add any kick from an accelerating cavity, if the particle is passing through one' },
  { code: 'v −= radiation loss', label: 'Subtract energy lost to radiation, if the particle is bending sharply' },
  { code: 'x += v·Δt, every particle', label: "Advance the particle's position and velocity by a small time step, and repeat for every particle, every step" },
];

export const AcceleratorLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Magnet className="w-4 h-4 text-gold-hover" />
          <span>Lesson 8 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Particle accelerator — when do we need simulation?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine a single charged particle shot into a ring where magnets bend its path. With
                nothing else around it, the particle traces a perfect circle, lap after lap, exactly where
                the magnets aim it. Simple enough to picture — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>What happens when you inject not one particle, but a tightly packed bunch of a billion, all repelling each other?</li>
                <li>Can you predict exactly how that bunch spreads out after a thousand laps?</li>
                <li>What if two such bunches are steered into a head-on collision?</li>
                <li>What if the guiding magnets aren't perfectly uniform along the ring?</li>
                <li>What if the particles are moving so fast that they radiate energy away as they bend?</li>
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
            <AcceleratorInstrumentWidget />
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
            questions={ACCELERATOR_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card id="pa-part-1" eyebrow="Part 1" title="Describing a charged particle in a field" icon={<Ruler className="w-5 h-5 text-gold-hover" />}>
            <p>
              Every particle in this lesson is described by a few quantities, and the field it moves
              through is described by one more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Charge</p>
                <p className="text-xs">
                  How strongly the particle responds to electric and magnetic fields. Written{' '}
                  <MathFormula latex="q" />, units coulombs (C).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Mass and speed</p>
                <p className="text-xs">
                  How much inertia the particle has, and how fast it is moving. Written{' '}
                  <MathFormula latex="m" /> (kg) and <MathFormula latex="v" /> (m/s).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Magnetic field</p>
                <p className="text-xs">
                  How strong the guiding field is, and which way it points. Written{' '}
                  <MathFormula latex="B" />, units tesla (T).
                </p>
              </div>
            </div>
            <p className="text-xs">
              A moving charge in a magnetic field feels a force at right angles to its motion, given by the
              Lorentz force law:
            </p>
            <Eq latex={String.raw`\vec{F} = q\,\vec{v} \times \vec{B}`} />
            <p className="font-semibold text-deepteal">
              Because this force always points sideways to the motion, it never speeds the particle up or
              slows it down — it only steers it. A sideways force that never changes the speed bends any
              path into a circle.
            </p>
          </Card>

          <Card id="pa-part-2" eyebrow="Part 2" title="One governing rule" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
            <p>
              Just as overlapping waves simply add, and overlapping electric fields simply add, a moving
              charge in a magnetic field follows one governing rule: at every instant, the force is
              perpendicular to both the velocity and the field, with a size that depends only on q, v, and B.
            </p>
            <Eq latex={String.raw`|\vec{F}| = qvB`} note="for motion perpendicular to the field" />
            <p className="font-semibold text-deepteal">
              That's it — no complicated interaction, no particle &ldquo;deciding&rdquo; where to go. The same
              rule applies at every point along the path, which is exactly what makes the motion predictable
              in the simplest case.
            </p>
          </Card>

          <Card id="pa-part-3" eyebrow="Part 3" title="Building the mathematical model" icon={<Gauge className="w-5 h-5 text-gold-hover" />}>
            <p className="font-semibold text-deepteal">Step 1 — One particle, one uniform field</p>
            <p className="text-xs">
              Suppose a single particle of charge <MathFormula latex="q" /> and mass <MathFormula latex="m" />{' '}
              moves with speed <MathFormula latex="v" />, perpendicular to a uniform magnetic field{' '}
              <MathFormula latex="B" />. The magnetic force continuously bends the path toward the centre of a
              circle, playing the role of centripetal force.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — Solve for the path</p>
            <p className="text-xs">
              Setting the magnetic force equal to the centripetal force needed for circular motion, and
              solving for the radius, gives an exact, closed-form result:
            </p>
            <Eq latex={String.raw`qvB = \frac{mv^2}{r} \quad\Longrightarrow\quad r = \frac{mv}{qB}`} />
            <p className="text-xs">This radius is often called the cyclotron radius, or gyroradius.</p>
            <SymbolTable
              rows={[
                { symbol: 'q', meaning: 'Charge of the particle' },
                { symbol: 'm', meaning: 'Mass of the particle' },
                { symbol: 'v', meaning: 'Speed of the particle' },
                { symbol: 'B', meaning: 'Strength of the magnetic field' },
                { symbol: 'r', meaning: 'Radius of the resulting circular path' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — The period doesn't depend on speed</p>
            <p className="text-xs">
              Combining the radius with the circumference of the circle gives the time for one full lap,
              called the cyclotron period:
            </p>
            <Eq latex={String.raw`T = \frac{2\pi r}{v} = \frac{2\pi m}{qB}`} />
            <p className="text-xs">
              Notice that speed cancels out of this formula entirely. A faster particle traces a bigger
              circle, but it takes exactly the same time to go around — which is precisely why accelerators can
              use a fixed oscillation frequency to keep giving particles a push, lap after lap.
            </p>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Worked example</p>
              <p className="text-xs">
                A proton (<MathFormula latex={String.raw`q = 1.6 \times 10^{-19}`} /> C,{' '}
                <MathFormula latex={String.raw`m = 1.67 \times 10^{-27}`} /> kg) moves at{' '}
                <MathFormula latex={String.raw`v = 3 \times 10^{6}`} /> m/s through a field of{' '}
                <MathFormula latex="B = 0.5" /> T.
              </p>
              <p className="font-mono text-xs text-deepteal">
                r = mv / (qB) = (1.67 × 10⁻²⁷)(3 × 10⁶) / [(1.6 × 10⁻¹⁹)(0.5)]
              </p>
              <p className="font-mono text-xs text-deepteal font-bold">≈ 0.063 m, about 6.3 cm</p>
              <p className="text-xs italic">
                And T = 2πm/(qB) ≈ 131 ns per lap — the time the simulator below measures.
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For a single charged particle in a uniform
                magnetic field, we have an exact formula for both the radius and the period of its path.
                Scientists use simulation when simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card id="pa-part-4" eyebrow="Part 4" title="Different particles and fields" icon={<Shapes className="w-5 h-5 text-gold-hover" />}>
            <p>The equations remain the same. Only the values of m, v, q, and B change.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Change</th>
                    <th className="text-left py-2 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {CHANGE_TABLE.map((row) => (
                    <tr key={row.change} className="border-b border-sage/30 align-top">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.change}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                'Why can a ring of fixed size accelerate particles to higher and higher speeds by just increasing the magnetic field over time?',
                'What happens to the period if you swap protons for much lighter electrons, keeping speed and field the same?',
                'Why might real accelerators need many separate magnets instead of one giant uniform field?',
              ]}
            />
            <p className="text-xs italic">
              Think before revealing the answer — then use the simulator below to check yourself.
            </p>
          </Card>

          <AcceleratorSimulator />

          <Card id="pa-part-5" eyebrow="Part 5" title="Why equations eventually fail" icon={<Cpu className="w-5 h-5 text-gold-hover" />}>
            <p>So far, we have assumed:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ASSUMPTIONS.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p>Real accelerators are usually far messier.</p>

            <p className="font-semibold text-deepteal pt-1">Many particles at once</p>
            <p>
              Real beams are not single particles — they are bunches containing billions of particles, all
              carrying the same sign of charge and all repelling each other. This mutual repulsion, called
              space charge, pushes the bunch to spread out over time, and the amount of spreading depends on
              the shape and density of the whole bunch, not just on one particle's formula.
            </p>

            <p className="font-semibold text-deepteal pt-1">Imperfect fields, collisions, and radiation</p>
            <p>
              Real magnets are never perfectly uniform, and accelerators add focusing magnets,
              radio-frequency cavities that push the particles forward in timed bursts, and collision points
              where two beams cross and interact with each other's fields. Fast, bending particles also
              radiate energy away as synchrotron radiation, which slowly changes their speed and, in turn,
              their radius.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Why simulation helps</p>
              <p className="text-xs">
                Once many particles, imperfect fields, timed accelerating cavities, and energy loss are all
                involved at once, no single formula captures the whole picture:
              </p>
              <ul className="space-y-0.5 text-xs">
                {[
                  'Each particle feels the guiding field, plus the fields from every nearby particle.',
                  'Radio-frequency cavities add timed kicks of energy as particles pass through.',
                  'Radiated energy is subtracted, changing the radius on the next lap.',
                  'The whole bunch shape keeps evolving, lap after lap.',
                ].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs">
                This feedback loop across billions of particles and millions of laps quickly becomes
                impossible to solve analytically. A simulation handles it naturally by tracking many particles
                through many small time steps.
              </p>
            </div>
          </Card>

          <Card id="pa-part-6" eyebrow="Part 6" title="How a simulation thinks" icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}>
            <p>
              Instead of solving everything at once, the computer repeatedly performs, for every particle —
              the same loop the simulator above and the Python lab below run:
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
              The evolving beam shape emerges naturally from these small steps, repeated for every particle
              in the bunch.
            </p>
          </Card>

          <Card id="pa-part-7" eyebrow="Part 7" title="Real-world applications" icon={<Radar className="w-5 h-5 text-gold-hover" />}>
            <p className="text-xs">Particle accelerator simulations are used in:</p>
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

export const AcceleratorLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">Key takeaway</p>
    <p className="text-sm text-sage-light leading-relaxed">
      A single charged particle in a uniform magnetic field can be described with one exact formula — the
      radius and period depend cleanly on charge, mass, speed, and field strength.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula latex={String.raw`r = \frac{mv}{qB} \qquad T = \frac{2\pi m}{qB}`} block className="text-cream" />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Many particles, imperfect fields, timed accelerating cavities, and radiated energy quickly become too
      complex to solve analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
