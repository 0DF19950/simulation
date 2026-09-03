import React from 'react';
import { Blend, GitBranch, Infinity as InfinityIcon, RefreshCw, Shuffle, Sigma, Split, Waypoints } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { DoublePendulumSimulator } from './DoublePendulumSimulator';
import { DoublePendulumInstrumentWidget } from './DoublePendulumInstrumentWidget';

const PENDULUM_QUESTIONS: QuizQuestion[] = [
  {
    id: 'dp1',
    prompt: 'A single pendulum, swung from a small angle, moves:',
    options: [
      { id: 'a', text: 'Chaotically and unpredictably' },
      { id: 'b', text: 'Back and forth in a smooth, repeating pattern' },
      { id: 'c', text: 'Faster and faster forever' },
      { id: 'd', text: 'In a perfect straight line' },
    ],
    correctId: 'b',
    explanation:
      'For small swings a single pendulum behaves like simple harmonic motion — a clean, repeating wave, exactly the θ(t) formula in Part 1.',
  },
  {
    id: 'dp2',
    prompt:
      'Two double pendulums are released from starting angles that differ by less than one degree. After a few seconds, their paths will be:',
    options: [
      { id: 'a', text: 'Nearly identical, since the starting angles were so close' },
      { id: 'b', text: 'Completely different from each other' },
      { id: 'c', text: 'Exactly mirrored' },
    ],
    correctId: 'b',
    explanation:
      "This is the sensitivity to starting conditions the rest of this lesson is about — tiny differences amplify into completely different motion within seconds. You'll watch it happen in the simulator below.",
  },
  {
    id: 'dp3',
    prompt: 'Does a double pendulum have an exact mathematical formula that predicts its angle at any future time, the way y(t) did for a falling ball?',
    options: [
      { id: 'a', text: 'Yes, always' },
      { id: 'b', text: 'No general formula like that exists' },
      { id: 'c', text: 'Only if you ignore gravity' },
    ],
    correctId: 'b',
    explanation:
      "The equations are nonlinear and coupled — there's no known way to solve them in closed form for the general case, unlike every system in Lessons 1–4.",
  },
];

const CONTENTS = [
  { id: 'dp-part-1', label: 'One arm vs. two' },
  { id: 'dp-part-2', label: 'Why the second arm changes everything' },
  { id: 'dp-part-3', label: 'Building the mathematical model' },
  { id: 'dp-part-4', label: 'Sensitivity to starting conditions' },
  { id: 'dp-part-5', label: 'Chaos is not the same as randomness' },
  { id: 'dp-part-6', label: 'How a simulation thinks' },
  { id: 'dp-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Explain why one more joint turns a simple oscillator into a system with no closed-form solution.',
  'Write the single-pendulum formula and recognize it as the solvable special case.',
  "Understand why the double pendulum's equations are nonlinear and coupled.",
  'Predict how tiny changes in starting angle affect the resulting motion.',
  'Distinguish deterministic chaos from randomness.',
  'Build the angular-acceleration function a real chaos simulation calls at every step.',
];

const SENSITIVITY_TABLE = [
  { t1: '90°', t2: '90°', outcome: 'Path A' },
  { t1: '90.001°', t2: '90°', outcome: 'A completely different path' },
  { t1: '90°', t2: '90.001°', outcome: 'Yet another completely different path' },
];

const APPLICATIONS = [
  'Weather and climate prediction',
  'Robotic arm and legged-robot control',
  'Structural engineering (swaying buildings and bridges)',
  'Population and ecosystem dynamics',
  'Fluid turbulence',
];

const SIM_STEPS = [
  { code: 'α1, α2 = f(θ1, θ2, ω1, ω2)', label: 'Calculate both angular accelerations together' },
  { code: 'ω1 += α1·Δt,  ω2 += α2·Δt', label: 'Update both angular velocities' },
  { code: 'θ1 += ω1·Δt,  θ2 += ω2·Δt', label: 'Update both angles' },
  { code: 't += Δt', label: 'Advance time by a very small step' },
  { code: 'repeat', label: 'Repeat — errors compound quickly in a chaotic system' },
];

export const DoublePendulumLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Shuffle className="w-4 h-4 text-gold-hover" />
          <span>Lesson 5 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Double pendulum — when do we need simulation?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine a rod hanging from a fixed point, with a second rod attached to the bottom
                of the first. You lift it slightly and let go. It swings. At first it looks almost
                predictable, like a normal pendulum. Then it starts to tumble, flip, and swirl in
                ways that don't seem to repeat.
              </p>
              <p className="font-bold text-deepteal mb-2">Suddenly, the problem becomes more interesting.</p>
              <p>
                In this lesson, you'll meet a system that finally breaks the pattern of every
                lesson before it: even in its simplest, cleanest form — no air resistance, no
                friction, no extra bodies — a double pendulum still has no exact formula for where
                it will be in the future. This is where simulation stops being a convenience and
                becomes the only option.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <DoublePendulumInstrumentWidget />
          </div>
        </div>

        <div className="max-w-3xl bg-cream-card border border-sage rounded-xl p-5">
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
            questions={PENDULUM_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card
            id="dp-part-1"
            eyebrow="Part 1"
            title="One arm vs. two"
            icon={<Split className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              A single pendulum is one rod, swinging from a fixed pivot. Its position can be
              described with just one angle, <MathFormula latex="\theta" />.
            </p>
            <p>
              A double pendulum adds a second rod, attached to the end of the first instead of to
              a fixed point. Now two angles are needed: <MathFormula latex="\theta_1" /> for the
              upper arm, <MathFormula latex="\theta_2" /> for the lower arm.
            </p>
            <p>
              This sounds like a small change — one more variable. But the second arm's motion
              depends on the first arm's motion, whose motion depends on the second arm pulling
              back on it. Each arm constantly changes the forces the other arm feels.
            </p>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                The single pendulum (for comparison)
              </p>
              <p className="text-xs">For small swings, a single pendulum's motion is described almost exactly by:</p>
              <Eq latex={String.raw`\theta(t) = \theta_0 \cdot \cos\!\left(\sqrt{g/L}\cdot t\right)`} />
              <SymbolTable
                rows={[
                  { symbol: '\\theta(t)', meaning: 'Angle at time t' },
                  { symbol: '\\theta_0', meaning: 'Starting angle' },
                  { symbol: 'g', meaning: 'Gravitational acceleration' },
                  { symbol: 'L', meaning: 'Length of the pendulum' },
                ]}
              />
              <p className="text-xs">
                This is a clean, repeating wave — exactly the kind of exact formula we found for
                falling bodies, projectiles, rocket Δv, and two-body orbits in earlier lessons.
              </p>
            </div>
          </Card>

          <Card
            id="dp-part-2"
            eyebrow="Part 2"
            title="Why the second arm changes everything"
            icon={<Blend className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              The upper arm doesn't just swing on its own — it has to carry the entire weight and
              motion of the lower arm, which is swinging independently at the end of it.
            </p>
            <p>
              As the lower arm swings out, it tugs the upper arm off balance. As the upper arm
              swings, it flings the lower arm's pivot point through space, changing the lower arm's
              motion too.
            </p>
            <p className="font-semibold text-deepteal">
              Each arm is constantly both a cause and a result of the other arm's motion. This kind
              of two-way coupling is what makes the system behave so differently from anything in
              Lessons 1–4.
            </p>
          </Card>

          <Card
            id="dp-part-3"
            eyebrow="Part 3"
            title="Building the mathematical model"
            icon={<Sigma className="w-5 h-5 text-gold-hover" />}
          >
            <p className="font-semibold text-deepteal">Step 1 — The two coupled equations</p>
            <p className="text-xs">
              The equations of motion can still be written down exactly, using the same tools
              (Newton's laws, or equivalently, Lagrangian mechanics) as every system so far. For two
              arms of length <MathFormula latex="L_1, L_2" /> and masses{' '}
              <MathFormula latex="m_1, m_2" />, the angular accelerations are:
            </p>
            <Eq latex={String.raw`\alpha_1 = f_1(\theta_1, \theta_2, \omega_1, \omega_2)`} />
            <Eq latex={String.raw`\alpha_2 = f_2(\theta_1, \theta_2, \omega_1, \omega_2)`} />
            <SymbolTable
              rows={[
                { symbol: '\\theta_1,\\ \\theta_2', meaning: 'Angles of the upper and lower arm' },
                { symbol: '\\omega_1,\\ \\omega_2', meaning: 'Angular velocities of each arm' },
                { symbol: '\\alpha_1,\\ \\alpha_2', meaning: 'Angular accelerations of each arm' },
                { symbol: 'f_1,\\ f_2', meaning: 'Functions combining both angles and both velocities together' },
              ]}
            />
            <p className="text-xs">
              The exact form of <MathFormula latex="f_1" /> and <MathFormula latex="f_2" /> is long
              and involves sines, cosines, and both masses and both lengths tangled together — but
              the important detail is simpler: each equation depends on both angles and both
              velocities at once.{' '}
              <strong className="text-deepteal">Neither arm can be solved on its own.</strong>
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — Why this breaks the pattern of earlier lessons</p>
            <p className="text-xs">
              In every previous lesson, we could isolate one changing quantity, solve for it
              directly, and plug in a time <MathFormula latex="t" /> to get an exact answer — a
              height, a velocity, a Δv, an orbital period. A double pendulum's equations are what
              mathematicians call <strong className="text-deepteal">nonlinear and coupled</strong>.
              There is no known way to untangle <MathFormula latex="\theta_1(t)" /> and{' '}
              <MathFormula latex="\theta_2(t)" /> into separate, closed-form functions of time —
              not an approximation, an actual mathematical impossibility for the general case.
            </p>

            <div className="bg-deepteal text-cream rounded-lg p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-sm">
                <strong>Yes — immediately, and unavoidably.</strong> Unlike every system in Lessons
                1–4, there is no special-case version of the double pendulum (short of freezing one
                arm) that has an exact solution. This is the first lesson where simulation isn't
                just easier — it's the only way to find out what happens next.
              </p>
            </div>
          </Card>

          <Card
            id="dp-part-4"
            eyebrow="Part 4"
            title="Sensitivity to starting conditions"
            icon={<GitBranch className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              The equations stay the same. Only the starting angles and starting velocities change.
              But here, tiny changes in the starting conditions do something new: they don't just
              shift the result slightly — they can produce a completely different-looking motion
              within a few swings.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[360px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Starting θ₁</th>
                    <th className="text-left py-2 pr-4 font-bold">Starting θ₂</th>
                    <th className="text-left py-2 font-bold">After a few seconds</th>
                  </tr>
                </thead>
                <tbody>
                  {SENSITIVITY_TABLE.map((row) => (
                    <tr key={row.t1 + row.t2} className="border-b border-sage/30">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.t1}</td>
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.t2}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                "If you can't predict the exact path, is the motion still governed by exact physical laws?",
                'Would a small pendulum and a large pendulum, released from the same angles, follow the same shape of path?',
                'Could two identical double pendulums, released by a machine with perfect precision, ever be released with truly identical starting angles?',
              ]}
            />
            <p className="text-xs italic">
              Don't calculate yet. Predict first — then use the simulator below to check yourself.
            </p>
          </Card>

          <DoublePendulumSimulator />

          <Card
            id="dp-part-5"
            eyebrow="Part 5"
            title="Chaos is not the same as randomness"
            icon={<InfinityIcon className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              It's tempting to think an unpredictable system must involve randomness somewhere. It
              doesn't.
            </p>
            <p>
              This is called <strong className="text-deepteal">deterministic chaos</strong>: the
              same starting conditions always produce the exact same motion, every single time.
              Nothing random is happening at all.
            </p>
            <p>
              The problem is different: any two starting conditions, no matter how close together,
              eventually produce wildly different motion. Since we can never measure a real
              starting angle with infinite precision, we can never predict the far future of a real
              double pendulum — even though the underlying physics is completely exact.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Why simulation helps
              </p>
              <p className="text-xs">
                A simulation can't escape this sensitivity either — a simulated double pendulum run
                twice with slightly different starting numbers will also diverge. But simulation is
                still the only tool available to actually watch what one specific set of starting
                conditions does, since no formula can tell us in advance. Angles and angular
                velocities change; each arm's forces depend on the other arm's current state; new
                accelerations are calculated for both arms together; angles and angular velocities
                change again. This tightly coupled feedback loop is exactly the situation
                simulation was built to handle.
              </p>
            </div>
          </Card>

          <Card
            id="dp-part-6"
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
              The tumbling, unrepeating motion emerges naturally from these small steps — and only
              from these small steps.
            </p>
          </Card>

          <Card
            id="dp-part-7"
            eyebrow="Part 7"
            title="Real-world applications"
            icon={<Waypoints className="w-5 h-5 text-gold-hover" />}
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

export const DoublePendulumLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
      Key takeaway
    </p>
    <p className="text-sm text-sage-light leading-relaxed">
      Every system in this course so far — a falling ball, a projectile, a rocket's Δv, a two-body
      orbit — had some simplified version that could be solved with a single exact formula.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center space-y-1">
      <MathFormula
        latex={String.raw`\alpha_1 = f_1(\theta_1, \theta_2, \omega_1, \omega_2) \qquad \alpha_2 = f_2(\theta_1, \theta_2, \omega_1, \omega_2)`}
        block
        className="text-cream"
      />
      <p className="font-mono text-[10px] text-sage-light/70">
        exact equations — and, unlike every closing before this one, no closed-form solution to show you
      </p>
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      A double pendulum has no such version. Its two arms are coupled so tightly, and so
      sensitively, that no formula can predict its far future — even though every step of its
      motion follows exact, deterministic physics.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation stops being a convenience, and becomes the only tool that works at
      all.
    </p>
  </div>
);
