import React from 'react';
import { Cpu, Flame, Gauge, RefreshCw, Rocket, Ruler, Satellite, Sigma } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { RocketSimulator } from './RocketSimulator';

const ROCKET_QUESTIONS: QuizQuestion[] = [
  {
    id: 'rkt1',
    prompt: 'As a rocket burns fuel at a constant rate, its acceleration:',
    options: [
      { id: 'a', text: 'Stays constant' },
      { id: 'b', text: 'Decreases over time' },
      { id: 'c', text: 'Increases over time' },
      { id: 'd', text: 'Goes to zero immediately' },
    ],
    correctId: 'c',
    explanation:
      'Thrust stays roughly the same, but mass keeps shrinking — and mass sits in the denominator of a = F/m. Less mass to push means more acceleration for the same force.',
  },
  {
    id: 'rkt2',
    prompt: 'Why does a rocket need to carry so much of its own mass as fuel?',
    options: [
      { id: 'a', text: 'Fuel makes the rocket lighter' },
      { id: 'b', text: 'Pushing mass out the back is what generates thrust' },
      { id: 'c', text: "It doesn't — fuel mass is mostly wasted weight" },
    ],
    correctId: 'b',
    explanation:
      "Thrust is Newton's third law: expel mass backward, get pushed forward. There's no way around carrying propellant when the push has to come from somewhere.",
  },
  {
    id: 'rkt3',
    prompt: 'If a rocket burns fuel at a constant rate in deep space (no gravity, no air), does it still speed up?',
    options: [
      { id: 'a', text: "No, thrust alone can't accelerate it" },
      { id: 'b', text: 'Yes, and its speed keeps increasing' },
      { id: 'c', text: 'Only briefly, then it stops' },
    ],
    correctId: 'b',
    explanation:
      "Thrust doesn't need anything to push against — unlike a car's tires on a road, it comes purely from momentum conservation of the expelled exhaust. It works identically in a vacuum, and actually gets stronger as the rocket gets lighter.",
  },
];

const CONTENTS = [
  { id: 'rkt-part-1', label: 'Forces on a rocket' },
  { id: 'rkt-part-2', label: 'The changing mass problem' },
  { id: 'rkt-part-3', label: 'Building the mathematical model' },
  { id: 'rkt-part-4', label: 'Different rockets' },
  { id: 'rkt-part-5', label: 'Why equations eventually fail' },
  { id: 'rkt-part-6', label: 'How a simulation thinks' },
  { id: 'rkt-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Identify the three forces acting on a rocket in flight.',
  "Explain why F = ma isn't enough once mass is changing.",
  'Derive the rocket equation (Tsiolkovsky) for total velocity change.',
  "Predict how mass ratio and exhaust velocity affect a rocket's performance.",
  'Recognize why gravity, drag, and a shrinking mass together defeat a single closed-form equation.',
  'Build the acceleration function a real launch simulation calls at every step.',
];

const ENGINE_TABLE = [
  { type: 'Solid-fuel booster', ve: '≈ 2,500 m/s' },
  { type: 'Liquid kerosene/oxygen engine', ve: '≈ 3,000–3,500 m/s' },
  { type: 'Liquid hydrogen/oxygen engine', ve: '≈ 4,400 m/s' },
  { type: 'Ion thruster', ve: '≈ 20,000–50,000 m/s' },
];

const APPLICATIONS = [
  'Orbital launch planning',
  'Mission abort and safety analysis',
  'Multi-stage vehicle design',
  'Reusable booster landing (like SpaceX Falcon 9)',
  'Interplanetary trajectory planning',
];

const SIM_STEPS = [
  { code: 'm = m0 − ∫(dm/dt)', label: 'Calculate current mass (subtract fuel burned)' },
  { code: 'F_thrust, F_weight, F_drag', label: 'Calculate thrust, weight, and drag forces' },
  { code: 'ax, ay = ΣF / m', label: 'Calculate acceleration (x and y)' },
  { code: 'vx += ax·Δt,  vy += ay·Δt', label: 'Update velocity (x and y)' },
  { code: 'x += vx·Δt,  y += vy·Δt', label: 'Update position (x and y)' },
  { code: 't += Δt', label: 'Advance time' },
  { code: 'repeat', label: 'Repeat until fuel runs out or orbit is reached' },
];

export const RocketLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="max-w-3xl space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Rocket className="w-4 h-4 text-gold-hover" />
          <span>Lesson 3 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Rocket launch — when do we need simulation?
        </h2>

        <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
          <p className="mb-2">
            Imagine standing at a launch pad, watching a rocket ignite. It lifts off the ground. It
            gets faster and faster the longer it burns. Simple enough — until someone asks:
          </p>
          <ul className="list-disc list-inside space-y-0.5 mb-2">
            <li>Why does the rocket seem to accelerate faster near the end of its burn?</li>
            <li>How fast will it be moving when the fuel runs out?</li>
            <li>What if the rocket carried more fuel, but also weighed more because of it?</li>
            <li>What if the rocket tips slightly as it climbs?</li>
            <li>What if the air gets thinner as it rises?</li>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <nav className="lg:sticky lg:top-20 bg-cream-card border border-sage rounded-xl p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2.5">
              Contents
            </p>
            <ol className="space-y-1 text-xs font-sans">
              {CONTENTS.map((c, i) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="flex gap-2 text-deepteal-soft hover:text-gold-hover transition-colors py-0.5"
                  >
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
            questions={ROCKET_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them once the physics makes them obvious."
            singleColumn
          />

          <Card
            id="rkt-part-1"
            eyebrow="Part 1"
            title="Forces on a rocket"
            icon={<Flame className="w-5 h-5 text-gold-hover" />}
          >
            <p>A rocket in flight is pushed and pulled by three main forces at once.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-gold/50 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Thrust</p>
                <p className="text-xs">
                  The engine expels mass (burned fuel) at high speed out the back. By Newton's
                  third law, this pushes the rocket forward.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Weight</p>
                <p className="text-xs">
                  Gravity pulls the rocket downward, exactly as in Lesson 1 — except the rocket's
                  mass is no longer constant.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Drag</p>
                <p className="text-xs">
                  Air resists the rocket's motion, exactly as introduced in Lesson 2.
                </p>
              </div>
            </div>
            <p className="text-xs italic">
              This lesson focuses on what's genuinely new here: thrust, and the fact that the
              rocket's own mass is shrinking as it flies.
            </p>
          </Card>

          <Card
            id="rkt-part-2"
            eyebrow="Part 2"
            title="The changing mass problem"
            icon={<Sigma className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              In Lessons 1 and 2, the falling ball and the thrown ball always had the same mass.
              Newton's second law was simple to apply:
            </p>
            <Eq latex={String.raw`F = ma`} />
            <p>
              A rocket breaks this assumption. As it burns fuel, mass leaves the rocket
              continuously. A more complete form of Newton's second law is needed:
            </p>
            <Eq latex={String.raw`F = \frac{d(mv)}{dt}`} />
            <p className="font-semibold text-deepteal">
              This means the rocket accelerates for two separate reasons: the engine is pushing it
              forward, and it is also getting lighter, so the same thrust has less mass to move.
            </p>
          </Card>

          <Card
            id="rkt-part-3"
            eyebrow="Part 3"
            title="Building the mathematical model"
            icon={<Ruler className="w-5 h-5 text-gold-hover" />}
          >
            <p className="font-semibold text-deepteal">Step 1 — Thrust force</p>
            <Eq latex={String.raw`F = v_e \cdot \frac{dm}{dt}`} />
            <SymbolTable
              rows={[
                { symbol: 'F', meaning: 'Thrust force' },
                { symbol: 'v_e', meaning: 'Exhaust velocity (relative to rocket)' },
                { symbol: 'dm/dt', meaning: 'Rate of fuel mass burned per second' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 2 — Acceleration</p>
            <Eq latex={String.raw`a = \frac{F}{m} - g`} />
            <p className="text-xs">
              Notice that <MathFormula latex="m" /> appears in the denominator. As{' '}
              <MathFormula latex="m" /> shrinks, the same thrust <MathFormula latex="F" /> produces
              more and more acceleration — this is why rockets appear to leap forward near the end
              of a burn.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 3 — The rocket equation (Tsiolkovsky)</p>
            <p className="text-xs">
              If we ignore gravity and air resistance, and assume exhaust velocity is constant,
              this problem actually has an exact solution for the change in velocity:
            </p>
            <Eq latex={String.raw`\Delta v = v_e \cdot \ln\!\left(\frac{m_0}{m_f}\right)`} />
            <SymbolTable
              rows={[
                { symbol: '\\Delta v', meaning: 'Total change in velocity' },
                { symbol: 'v_e', meaning: 'Exhaust velocity' },
                { symbol: 'm_0', meaning: 'Initial mass (rocket + fuel)' },
                { symbol: 'm_f', meaning: 'Final mass (rocket after burnout)' },
                { symbol: '\\ln', meaning: 'Natural logarithm' },
              ]}
            />

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Worked example
              </p>
              <p className="text-xs">
                A rocket has <MathFormula latex="m_0 = 50{,}000" /> kg,{' '}
                <MathFormula latex="m_f = 10{,}000" /> kg after burnout, and{' '}
                <MathFormula latex="v_e = 3{,}000" /> m/s.
              </p>
              <p className="font-mono text-xs text-deepteal">Δv = 3000 · ln(50000 / 10000)</p>
              <p className="font-mono text-xs text-deepteal font-bold">
                Δv = 3000 · ln(5) ≈ 3000 · 1.609 ≈ 4,830 m/s
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">Not for this specific question.</strong> The
                rocket equation gives us an exact answer for total velocity change, as long as we
                ignore gravity, drag, and any change in direction. Scientists use simulation when
                simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card
            id="rkt-part-4"
            eyebrow="Part 4"
            title="Different rockets"
            icon={<Gauge className="w-5 h-5 text-gold-hover" />}
          >
            <p>The equations remain the same. Only the mass ratio (m₀/m_f) and exhaust velocity v_e change.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Rocket type</th>
                    <th className="text-left py-2 font-bold">Typical exhaust velocity vₑ</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGINE_TABLE.map((row) => (
                    <tr key={row.type} className="border-b border-sage/30">
                      <td className="py-2 pr-4 text-deepteal font-semibold">{row.type}</td>
                      <td className="py-2 text-deepteal-soft font-mono">{row.ve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                'Which rocket type reaches the highest Δv for the same mass ratio?',
                'Does carrying more fuel always help, even though it also adds weight?',
                "Why might an ion thruster be useless for launching from Earth's surface, despite its huge vₑ?",
              ]}
            />
            <p className="text-xs italic">
              Don't calculate yet. Predict first — then use the simulator below to check yourself.
            </p>
          </Card>

          <RocketSimulator />

          <Card
            id="rkt-part-5"
            eyebrow="Part 5"
            title="Why equations eventually fail"
            icon={<Cpu className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              So far, the rocket equation has assumed no gravity, no air resistance, constant
              exhaust velocity, motion in a straight line, and a single, unchanging engine. Real
              rocket launches are far messier.
            </p>

            <p className="font-semibold text-deepteal pt-1">Gravity loss</p>
            <p>
              A real rocket must fight gravity the entire time it burns, not just at the end.
              Every second spent climbing instead of gaining horizontal speed is velocity "lost"
              to gravity.
            </p>

            <p className="font-semibold text-deepteal pt-1">The gravity turn</p>
            <p>
              Real rockets don't fly straight up. They gradually tip over into a curved path,
              trading vertical speed for horizontal speed — which means this is now a
              two-direction problem like Lesson 2, but with a constantly shrinking mass on top of
              it.
            </p>

            <p className="font-semibold text-deepteal pt-1">Changing air density and staging</p>
            <p>
              Drag depends on air density, which drops rapidly with altitude. On top of that, real
              rockets often drop empty stages mid-flight, causing mass to jump downward suddenly
              rather than shrink smoothly.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Why simulation helps
              </p>
              <p className="text-xs">
                Once gravity, a changing flight angle, changing air density, and shrinking mass all
                act together, the forces on the rocket are constantly changing in ways that depend
                on each other: mass changes → acceleration changes → velocity and direction change
                → altitude changes → air density and drag change → mass changes again. This
                feedback loop quickly becomes impossible to solve with a single clean equation. A
                simulation handles it naturally by updating the system in many small time steps.
              </p>
            </div>
          </Card>

          <Card
            id="rkt-part-6"
            eyebrow="Part 6"
            title="How a simulation thinks"
            icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              Instead of solving everything at once, the computer repeats a short loop — the same
              loop the Python lab below runs every time you hit &ldquo;Run&rdquo;:
            </p>
            <ol className="space-y-1.5">
              {SIM_STEPS.map((s, i) => (
                <li
                  key={s.label}
                  className="flex items-baseline gap-3 bg-cream border border-sage/60 rounded-lg px-3 py-2"
                >
                  <span className="font-mono text-[10px] font-bold text-gold-hover shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-deepteal-soft flex-1">{s.label}</span>
                  <code className="font-mono text-[11px] text-deepteal whitespace-nowrap">
                    {s.code}
                  </code>
                </li>
              ))}
            </ol>
            <p className="font-semibold text-deepteal">
              The full launch trajectory emerges naturally from these small steps.
            </p>
          </Card>

          <Card
            id="rkt-part-7"
            eyebrow="Part 7"
            title="Real-world applications"
            icon={<Satellite className="w-5 h-5 text-gold-hover" />}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {APPLICATIONS.map((a) => (
                <li
                  key={a}
                  className="bg-cream border border-sage/60 rounded-lg px-3 py-2 text-xs text-deepteal-soft"
                >
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

export const RocketLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
      Key takeaway
    </p>
    <p className="text-sm text-sage-light leading-relaxed">
      A rocket's total velocity change can be solved exactly with the rocket equation, as long as
      gravity, drag, and direction are ignored.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula
        latex={String.raw`\Delta v = v_e \cdot \ln\!\left(\frac{m_0}{m_f}\right)`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      A real launch, with a shrinking mass, a curving path, changing air density, and possibly
      multiple stages, quickly becomes impossible to solve with one clean equation.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
