import React from 'react';
import { Globe2, Orbit, Rocket, Sigma, Target } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { OrbitSimulator } from './OrbitSimulator';

const ORBIT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'orb1',
    prompt: 'What keeps a satellite in orbit around Earth?',
    options: [
      { id: 'a', text: 'No force acts on it' },
      { id: 'b', text: 'Gravity' },
      { id: 'c', text: 'Air resistance' },
      { id: 'd', text: "The satellite's engine continuously pushes it forward" },
    ],
    correctId: 'b',
    explanation:
      'Gravity, and nothing else. A satellite in orbit is falling the entire time — it simply keeps missing the ground, because Earth curves away beneath it.',
  },
  {
    id: 'orb2',
    prompt: 'If a satellite moves faster while at the same distance from Earth, what do you expect?',
    options: [
      { id: 'a', text: 'It must move closer to Earth' },
      { id: 'b', text: 'It may enter a different orbit' },
      { id: 'c', text: 'It immediately stops' },
      { id: 'd', text: 'Gravity disappears' },
    ],
    correctId: 'b',
    explanation:
      'Speed and distance together decide the shape of the orbit. More speed at the same radius stretches a circle into an ellipse — and past √2 times circular speed, into an escape.',
  },
  {
    id: 'orb3',
    prompt: 'An astronaut inside a spacecraft orbiting Earth feels weightless. Does that mean gravity is zero?',
    options: [
      { id: 'a', text: 'Yes' },
      { id: 'b', text: 'No' },
    ],
    correctId: 'b',
    explanation:
      'Gravity at the ISS is about 90% of its value at the ground. The astronaut feels weightless because they and the spacecraft are falling together — free fall, not absence of gravity.',
  },
];

const CONTENTS = [
  { id: 'orb-part-1', label: 'Describing orbital motion' },
  { id: 'orb-part-2', label: 'Gravity' },
  { id: 'orb-part-3', label: 'From gravity to orbital motion' },
  { id: 'orb-part-4', label: 'Circular orbits' },
  { id: 'orb-part-5', label: 'How an orbiting object moves' },
  { id: 'orb-part-6', label: 'How a simulation thinks' },
  { id: 'orb-part-7', label: 'Why initial velocity matters' },
  { id: 'orb-part-8', label: 'Circular vs. elliptical' },
  { id: 'orb-part-9', label: 'Why simulation matters more' },
  { id: 'orb-part-10', label: 'Real-world applications' },
];

const GOALS = [
  'Describe orbital motion using position, velocity, and acceleration.',
  "Connect Newton's law of gravitation to orbital motion.",
  'Derive the circular orbital velocity.',
  'Understand how initial velocity changes an orbit.',
  'Build the basic equations used by an orbital simulation.',
  'Recognize when simulation becomes more useful than a simple closed-form formula.',
];

const APPLICATIONS = [
  'Satellite design',
  'Spacecraft trajectory planning',
  'Earth observation',
  'Moon missions',
  'Planetary exploration',
  'Communication satellites',
  'Space telescopes',
  'Mission planning',
];

const HARD_CASES = [
  'elliptical trajectories',
  'changing velocity',
  'multiple gravitational bodies',
  'atmospheric drag',
  'non-spherical planets',
  'perturbations from the Moon and Sun',
  'spacecraft thrust',
  'changing mass',
];

const SIM_STEPS = [
  { code: 'r = |r|', label: 'Calculate distance' },
  { code: 'a = -G M r / r³', label: 'Calculate gravitational acceleration' },
  { code: 'v_new = v + a Δt', label: 'Update velocity' },
  { code: 'r_new = r + v Δt', label: 'Update position' },
  { code: 't = t + Δt', label: 'Advance time' },
  { code: 'repeat', label: 'Do it again' },
];

export const OrbitalLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="max-w-3xl space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Orbit className="w-4 h-4 text-gold-hover" />
          <span>Lesson 3 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Orbital motion — when do we need simulation?
        </h2>

        <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
          <p className="mb-2">
            Imagine throwing a ball horizontally from the top of a very tall mountain. The ball moves
            forward while gravity pulls it downward. What if you could throw it so fast that, while
            the ball is falling toward Earth, the Earth curves away beneath it?
          </p>
          <p className="font-bold text-deepteal">
            The ball might never hit the ground. It would be orbiting Earth.
          </p>
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
            questions={ORBIT_QUESTIONS}
            title="Before calculating anything"
            intro="Answer these from intuition alone. Keep your answers — we return to them later."
            singleColumn
          />

          <Card
            id="orb-part-1"
            eyebrow="Part 1"
            title="Describing orbital motion"
            icon={<Sigma className="w-5 h-5 text-gold-hover" />}
          >
            <p>Just as with falling objects, we need quantities to describe motion.</p>

            <div className="space-y-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Position</p>
                <p className="text-xs">
                  Position tells us where the object is. For orbital motion, one dimension is no
                  longer enough — we describe position with{' '}
                  <MathFormula latex="x" /> and <MathFormula latex="y" />, or more generally with a
                  position vector <MathFormula latex={String.raw`\mathbf{r}`} />.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Velocity</p>
                <p className="text-xs mb-2">
                  Velocity tells us how quickly the position changes. It has both magnitude and
                  direction.
                </p>
                <Eq latex={String.raw`\mathbf{v}=\frac{d\mathbf{r}}{dt}`} />
              </div>
              <div className="bg-cream border border-gold/50 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Acceleration</p>
                <p className="text-xs mb-2">
                  Acceleration tells us how quickly velocity changes. An object can accelerate{' '}
                  <em>even when its speed stays constant</em> — which is exactly what happens in a
                  circular orbit.
                </p>
                <Eq latex={String.raw`\mathbf{a}=\frac{d\mathbf{v}}{dt}`} />
              </div>
            </div>
          </Card>

          <Card id="orb-part-2" eyebrow="Part 2" title="Gravity" icon={<Globe2 className="w-5 h-5 text-gold-hover" />}>
            <p>
              Gravity is the force that attracts two masses toward each other. For an object of mass{' '}
              <MathFormula latex="m" /> orbiting a planet of mass <MathFormula latex="M" />:
            </p>
            <Eq latex={String.raw`F=\frac{GMm}{r^2}`} />
            <SymbolTable
              rows={[
                { symbol: 'F', meaning: 'Gravitational force' },
                { symbol: 'G', meaning: 'Gravitational constant' },
                { symbol: 'M', meaning: 'Mass of the planet' },
                { symbol: 'm', meaning: 'Mass of the satellite' },
                { symbol: 'r', meaning: 'Distance between their centers' },
              ]}
            />
            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="text-xs mb-2">Notice something important:</p>
              <Eq latex={String.raw`F \propto \frac{1}{r^2}`} />
              <p className="text-xs mt-2">
                As the distance increases, gravitational force decreases. If the distance becomes
                twice as large, the force becomes{' '}
                <strong className="text-deepteal">one quarter</strong> as large.
              </p>
            </div>
          </Card>

          <Card id="orb-part-3" eyebrow="Part 3" title="From gravity to orbital motion">
            <p>Newton's second law tells us:</p>
            <Eq latex={String.raw`F = ma`} />
            <p>Gravity provides the force:</p>
            <Eq latex={String.raw`ma=\frac{GMm}{r^2}`} />
            <p>
              Cancel <MathFormula latex="m" />:
            </p>
            <Eq latex={String.raw`a=\frac{GM}{r^2}`} />
            <p className="font-semibold text-deepteal">
              The acceleration points toward the center of the planet. This is gravitational
              acceleration — and notice that the satellite's own mass has dropped out entirely.
            </p>
          </Card>

          <Card id="orb-part-4" eyebrow="Part 4" title="Circular orbits">
            <p>
              Let's start with the simplest orbit: a perfect circle. The satellite is constantly
              changing direction, therefore it is accelerating. For circular motion:
            </p>
            <Eq latex={String.raw`a_c=\frac{v^2}{r}`} />
            <p>Gravity provides this acceleration:</p>
            <Eq latex={String.raw`\frac{v^2}{r}=\frac{GM}{r^2}`} />
            <p>Therefore:</p>
            <Eq
              latex={String.raw`\boxed{\;v=\sqrt{\frac{GM}{r}}\;}`}
              note="the circular orbital velocity"
            />
            <p>
              The important idea is that orbital speed depends on the distance from the center of the
              planet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Closer orbit
                </p>
                <MathFormula latex={String.raw`r \downarrow \;\Rightarrow\; v \uparrow`} className="text-deepteal" />
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Higher orbit
                </p>
                <MathFormula latex={String.raw`r \uparrow \;\Rightarrow\; v \downarrow`} className="text-deepteal" />
              </div>
            </div>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                Not necessarily. For an ideal circular orbit we have a mathematical solution — we can
                calculate the required orbital velocity directly. But now change the problem. Give
                the spacecraft an initial position, an initial velocity, and Earth's gravity, and
                then simply <em>let it move</em>. We need to calculate its position and velocity
                again and again over time.
              </p>
              <p className="text-xs font-semibold text-deepteal mt-1.5">
                This is where simulation becomes useful.
              </p>
            </div>
          </Card>

          <Card id="orb-part-5" eyebrow="Part 5" title="How an orbiting object moves">
            <p>
              At every moment, gravity points toward Earth while the spacecraft has a velocity with
              its own direction. The model can be written as two coupled differential equations:
            </p>
            <Eq latex={String.raw`\frac{d\mathbf{r}}{dt}=\mathbf{v} \qquad\qquad \frac{d\mathbf{v}}{dt}=-\frac{GM\,\mathbf{r}}{r^3}`} />
            <p>These equations describe how position and velocity evolve over time.</p>
            <p className="text-xs italic">
              The minus sign and the <MathFormula latex={String.raw`\mathbf{r}/r^3`} /> together do
              two jobs at once: they point the acceleration back toward Earth, and they scale it as{' '}
              <MathFormula latex={String.raw`1/r^2`} />.
            </p>
          </Card>

          <Card
            id="orb-part-6"
            eyebrow="Part 6"
            title="How a simulation thinks"
            icon={<Target className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              Instead of solving the entire orbit at once, a computer can move forward in small time
              steps.
            </p>
            <ol className="space-y-1.5">
              {SIM_STEPS.map((s, i) => (
                <li
                  key={s.code}
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
              Thousands or millions of these small updates can produce the complete orbit.
            </p>
          </Card>

          <Card
            id="orb-part-7"
            eyebrow="Part 7"
            title="Why initial velocity matters"
            icon={<Rocket className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              Imagine an object near Earth. The initial velocity strongly affects what happens next.
            </p>
            <div className="space-y-2">
              <div className="bg-cream border border-sage/60 rounded-lg p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Too small
                </p>
                <p className="text-xs">
                  Gravity pulls the object downward before it can travel far, and it eventually falls
                  toward Earth.
                </p>
              </div>
              <div className="bg-cream border border-gold/50 rounded-lg p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-gold-hover mb-1">
                  Just right
                </p>
                <p className="text-xs">
                  The object continuously falls toward Earth, but Earth's surface curves away
                  beneath it. The object remains in orbit.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1">
                  Very large
                </p>
                <p className="text-xs">
                  The object enters a higher-energy trajectory. If its velocity becomes sufficiently
                  large, it can escape Earth's gravitational influence.
                </p>
              </div>
            </div>
            <p className="bg-cream border-l-2 border-gold rounded-r-lg p-3 font-sans font-semibold text-deepteal text-sm">
              An orbit is the result of gravity + initial position + initial velocity.
            </p>
            <Predict
              items={[
                'Case 1 — the satellite starts with a velocity that is too small. What happens?',
                'Case 2 — the satellite starts with the circular orbital velocity. What happens?',
                'Case 3 — the satellite starts faster than circular orbital velocity. What changes?',
                'Case 4 — gravity is set to zero. What trajectory do you expect?',
              ]}
            />
            <p className="text-xs italic">
              Don't calculate yet. Predict first — then use the simulator below to check yourself.
              Its presets are these four cases.
            </p>
          </Card>

          <OrbitSimulator />

          <Card id="orb-part-8" eyebrow="Part 8" title="Circular vs. elliptical orbits">
            <p>
              A circular orbit is only one possibility. If the initial conditions are different, the
              trajectory can become elliptical. An elliptical orbit has two important points:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1">
                  Periapsis
                </p>
                <p className="text-xs">The point closest to the central body.</p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1">
                  Apoapsis
                </p>
                <p className="text-xs">The point farthest from the central body.</p>
              </div>
            </div>
            <p>
              The spacecraft generally moves faster when it is closer and slower when it is farther
              away. Therefore the speed is{' '}
              <strong className="text-deepteal">no longer constant</strong> — watch the current-speed
              readout in the simulator as an elliptical orbit runs.
            </p>
          </Card>

          <Card id="orb-part-9" eyebrow="Part 9" title="Why simulation becomes more important">
            <p>For the ideal circular orbit, we had a simple formula:</p>
            <Eq latex={String.raw`v=\sqrt{\frac{GM}{r}}`} />
            <p>But real orbital systems can include:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {HARD_CASES.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p>
              Now the system becomes much harder to describe with one simple equation. For example,
              if atmospheric drag is included, the total force contains both gravity and drag. Drag
              depends on velocity, but velocity is changing. So drag is changing, which changes
              acceleration, which changes velocity again.
            </p>
            <p className="font-semibold text-deepteal">
              This feedback makes simulation particularly useful.
            </p>
          </Card>

          <Card id="orb-part-10" eyebrow="Part 10" title="Real-world applications">
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {APPLICATIONS.map((a) => (
                <li
                  key={a}
                  className="bg-cream border border-sage/60 rounded-lg px-3 py-2 text-xs text-deepteal-soft text-center"
                >
                  {a}
                </li>
              ))}
            </ul>
            <p className="pt-1">A simulation can help engineers answer questions such as:</p>
            <ul className="space-y-1 text-xs">
              {[
                'Where will the spacecraft be after 10 hours?',
                'What happens if the initial velocity changes by 1%?',
                'Will the spacecraft collide with the planet?',
                'How much fuel is required for a trajectory change?',
              ].map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span className="italic">{q}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

export const OrbitalLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
      Key takeaway
    </p>
    <p className="text-sm text-sage-light leading-relaxed">
      An orbiting object is not floating without forces. Gravity is continuously changing its
      velocity.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula latex={String.raw`v=\sqrt{\frac{GM}{r}}`} block className="text-cream" />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      For a simple circular orbit, mathematics gives us an exact relationship. But when the system
      becomes more realistic — with changing velocities, elliptical trajectories, multiple bodies,
      drag, and spacecraft maneuvers — the equations become much harder to solve directly.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools for studying orbital motion.
    </p>
  </div>
);
