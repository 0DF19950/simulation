import React from 'react';
import { Compass, Cpu, Gauge, RefreshCw, Rocket, Sigma, Sliders, Target } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { ProjectileSimulator } from './ProjectileSimulator';

const PROJECTILE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'proj1',
    prompt: 'If you throw a ball at an angle, what shape does its path trace through the air?',
    options: [
      { id: 'a', text: 'A straight line' },
      { id: 'b', text: 'A curve (parabola)' },
      { id: 'c', text: 'A zigzag' },
      { id: 'd', text: 'A circle' },
    ],
    correctId: 'b',
    explanation:
      'A constant horizontal speed combined with a constantly-changing vertical speed traces exactly one shape: a parabola.',
  },
  {
    id: 'proj2',
    prompt: 'While the ball is in the air, what happens to its horizontal speed (ignoring air resistance)?',
    options: [
      { id: 'a', text: 'It speeds up' },
      { id: 'b', text: 'It slows down' },
      { id: 'c', text: 'It stays the same' },
    ],
    correctId: 'c',
    explanation:
      'No force acts sideways once the ball leaves your hand, so there is nothing to change its horizontal velocity — it stays exactly what it started at.',
  },
  {
    id: 'proj3',
    prompt: 'Two balls are launched at the same speed — one at 30° and one at 60°. Which statement is true?',
    options: [
      { id: 'a', text: '30° always travels farther' },
      { id: 'b', text: '60° always travels farther' },
      { id: 'c', text: '30° and 60° travel the same horizontal distance' },
    ],
    correctId: 'c',
    explanation:
      "30° and 60° are complementary angles (they add to 90°), and complementary launch angles always produce the same range — you'll see exactly why once we split v₀ into components.",
  },
];

const CONTENTS = [
  { id: 'proj-part-1', label: 'Two motions at once' },
  { id: 'proj-part-2', label: 'Splitting the launch' },
  { id: 'proj-part-3', label: 'Building the mathematical model' },
  { id: 'proj-part-4', label: 'Different launch angles' },
  { id: 'proj-part-5', label: 'Why equations eventually fail' },
  { id: 'proj-part-6', label: 'How a simulation thinks' },
  { id: 'proj-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe motion that happens in two directions at the same time.',
  'Split a launch velocity into horizontal and vertical components.',
  'Derive the equations of motion for x(t) and y(t).',
  'Predict range, height, and flight time from launch angle and speed.',
  'Recognize when air resistance makes the closed-form equations break down.',
  'Build the acceleration function a real simulation calls at every step.',
];

const ANGLE_TABLE = [
  { angle: '15°', shape: 'Long, low, flat arc' },
  { angle: '45°', shape: 'Maximum range (no air resistance)' },
  { angle: '75°', shape: 'Short, tall, steep arc' },
];

const APPLICATIONS = [
  'Sports science (baseball, golf, basketball)',
  'Artillery and ballistics',
  'Video game physics engines',
  'Firefighting (water cannon trajectories)',
  'Robotics (throwing and catching)',
];

const SIM_STEPS = [
  { code: 'ax, ay = a(x, y, vx, vy)', label: 'Calculate acceleration (x and y)' },
  { code: 'vx += ax·Δt,  vy += ay·Δt', label: 'Update velocity (x and y)' },
  { code: 'x += vx·Δt,  y += vy·Δt', label: 'Update position (x and y)' },
  { code: 't += Δt', label: 'Advance time' },
  { code: 'repeat', label: 'Do it again' },
];

export const ProjectileLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="max-w-3xl space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Target className="w-4 h-4 text-gold-hover" />
          <span>Lesson 2 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Projectile motion — when do we need simulation?
        </h2>

        <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
          <p className="mb-2">
            Imagine standing on the ground and throwing a ball forward, at an angle, as hard as you
            can. The ball leaves your hand, curves through the air, and lands somewhere ahead of
            you. Simple enough — until someone asks:
          </p>
          <ul className="list-disc list-inside space-y-0.5 mb-2">
            <li>How far will it travel before landing?</li>
            <li>How high will it go?</li>
            <li>What angle gives the longest distance?</li>
            <li>What if you threw it harder?</li>
            <li>What if there was air resistance?</li>
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
            questions={PROJECTILE_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them once the physics makes them obvious."
            singleColumn
          />

          <Card
            id="proj-part-1"
            eyebrow="Part 1"
            title="Two motions at once"
            icon={<Compass className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              Projectile motion looks complicated because it happens in two directions at the same
              time: horizontal and vertical. The key idea in this lesson is that these two
              directions can be treated <strong className="text-deepteal">separately</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Horizontal motion</p>
                <p className="text-xs">
                  No force acts sideways (we're ignoring air resistance for now). Horizontal
                  velocity never changes — it's simple, constant-speed motion.
                </p>
              </div>
              <div className="bg-cream border border-gold/50 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Vertical motion</p>
                <p className="text-xs">
                  Gravity still pulls downward, exactly as in Lesson 1. Vertical motion behaves
                  exactly like a falling body — it speeds up as it falls.
                </p>
              </div>
            </div>
            <p className="text-xs italic">
              Position, velocity, and acceleration now need a direction attached to them:{' '}
              <MathFormula latex="x" /> for horizontal, <MathFormula latex="y" /> for vertical.
            </p>
          </Card>

          <Card
            id="proj-part-2"
            eyebrow="Part 2"
            title="Splitting the launch"
            icon={<Sliders className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              When a ball is launched at speed <MathFormula latex="v_0" /> and angle{' '}
              <MathFormula latex="\theta" /> (measured from the ground), that single velocity is
              really made of two separate parts.
            </p>
            <Eq latex={String.raw`v_{0x} = v_0 \cos\theta \qquad v_{0y} = v_0 \sin\theta`} />
            <p>
              A steep angle sends more speed upward. A shallow angle sends more speed forward. This
              is why angle changes the shape of the path even when launch speed stays the same.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Near 0°
                </p>
                <p className="text-xs">Forward (horizontal)</p>
              </div>
              <div className="bg-cream border border-gold/50 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-gold-hover mb-1">
                  45°
                </p>
                <p className="text-xs">Balanced between forward and upward</p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Near 90°
                </p>
                <p className="text-xs">Upward (vertical)</p>
              </div>
            </div>
          </Card>

          <Card
            id="proj-part-3"
            eyebrow="Part 3"
            title="Building the mathematical model"
            icon={<Sigma className="w-5 h-5 text-gold-hover" />}
          >
            <p className="font-semibold text-deepteal">Step 1 — Acceleration</p>
            <Eq latex={String.raw`a_x = 0 \qquad a_y = -g`} />
            <p className="text-xs">
              Horizontal acceleration is zero. Vertical acceleration is gravity, acting downward.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — Velocity</p>
            <Eq latex={String.raw`v_x(t) = v_{0x} \qquad v_y(t) = v_{0y} - gt`} />

            <p className="font-semibold text-deepteal pt-2">Step 3 — Position</p>
            <Eq latex={String.raw`x(t) = x_0 + v_{0x}t \qquad y(t) = y_0 + v_{0y}t - \frac{1}{2}gt^2`} />
            <SymbolTable
              rows={[
                { symbol: 'x(t),\\ y(t)', meaning: 'Horizontal / vertical position at time t' },
                { symbol: 'v_x(t),\\ v_y(t)', meaning: 'Horizontal / vertical velocity at time t' },
                { symbol: 'v_{0x},\\ v_{0y}', meaning: 'Initial horizontal / vertical velocity' },
                { symbol: 'g', meaning: 'Gravitational acceleration' },
                { symbol: 't', meaning: 'Time' },
              ]}
            />

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Worked example
              </p>
              <p className="text-xs">
                A ball is launched with <MathFormula latex="v_0 = 20" /> m/s at{' '}
                <MathFormula latex="\theta = 30°" />, from ground level.
              </p>
              <p className="font-mono text-xs text-deepteal">
                v₀ₓ = 20 · cos(30°) ≈ 17.3 m/s &nbsp;&nbsp; v₀ᵧ = 20 · sin(30°) = 10 m/s
              </p>
              <p className="text-xs">After 1 second:</p>
              <p className="font-mono text-xs text-deepteal font-bold">
                x = 17.3(1) = 17.3 m &nbsp;&nbsp; y = 10(1) − ½(9.8)(1)² = 5.1 m
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For this problem we already have an
                exact solution — substitute a value for time, calculate the position directly.
                Scientists use simulation when simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card
            id="proj-part-4"
            eyebrow="Part 4"
            title="Different launch angles"
            icon={<Gauge className="w-5 h-5 text-gold-hover" />}
          >
            <p>The equations remain the same. Only the value of θ (and v₀) changes.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[280px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Launch angle θ</th>
                    <th className="text-left py-2 font-bold">Typical shape of path</th>
                  </tr>
                </thead>
                <tbody>
                  {ANGLE_TABLE.map((row) => (
                    <tr key={row.angle} className="border-b border-sage/30">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.angle}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.shape}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                'Which angle produces the longest horizontal distance?',
                'Which angle produces the greatest maximum height?',
                'Which angle produces the shortest flight time?',
              ]}
            />
            <p className="text-xs italic">
              Don't calculate yet. Predict first — then use the simulator below to check yourself.
              Its presets are these three angles.
            </p>
          </Card>

          <ProjectileSimulator />

          <Card
            id="proj-part-5"
            eyebrow="Part 5"
            title="Why equations eventually fail"
            icon={<Cpu className="w-5 h-5 text-gold-hover" />}
          >
            <p>So far, we have assumed constant gravity, no air resistance, no wind, no spin on the object. Real-world problems are usually more complicated.</p>

            <p className="font-semibold text-deepteal pt-1">Air resistance</p>
            <p>
              Air pushes against moving objects, and it pushes in the direction opposite to
              motion — not just downward. This means drag now affects both the horizontal and
              vertical motion at the same time.
            </p>
            <Eq latex={String.raw`F_d \propto v^2`} note="drag increases with the square of speed — doubling speed quadruples it" />

            <p className="font-semibold text-deepteal pt-1">Advanced model</p>
            <Eq latex={String.raw`F_d = \frac{1}{2}\rho C_d A v^2`} />
            <SymbolTable
              rows={[
                { symbol: 'F_d', meaning: 'Drag force' },
                { symbol: '\\rho', meaning: 'Density of air' },
                { symbol: 'C_d', meaning: 'Drag coefficient' },
                { symbol: 'A', meaning: 'Cross-sectional area' },
                { symbol: 'v', meaning: 'Speed' },
              ]}
            />

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Why simulation helps
              </p>
              <p className="text-xs">
                Once drag depends on speed, and has both a horizontal and vertical component, the
                forces on the ball are constantly changing in two directions at once: velocity
                changes → drag changes → acceleration changes → velocity changes again, in both x
                and y. This feedback loop quickly becomes difficult to solve analytically. A
                simulation handles it naturally by updating the system in many small time steps.
              </p>
            </div>
          </Card>

          <Card
            id="proj-part-6"
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
              The curved path emerges naturally from these small steps — no closed-form equation
              required.
            </p>
          </Card>

          <Card
            id="proj-part-7"
            eyebrow="Part 7"
            title="Real-world applications"
            icon={<Rocket className="w-5 h-5 text-gold-hover" />}
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

export const ProjectileLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
      Key takeaway
    </p>
    <p className="text-sm text-sage-light leading-relaxed">
      A projectile in a vacuum can be solved exactly by splitting its motion into two independent
      directions.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula
        latex={String.raw`x(t) = x_0 + v_{0x}t \qquad y(t) = y_0 + v_{0y}t - \frac{1}{2}gt^2`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      A projectile experiencing air resistance couples those two directions back together, and
      quickly becomes difficult to solve analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
