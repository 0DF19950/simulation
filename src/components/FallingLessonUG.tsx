import React from 'react';
import { AlertTriangle, BookOpen, GitCompare, Layers, ListChecks, ShieldCheck, Sigma, Waves } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { NumericalExperiment } from './NumericalExperiment';
import { TerminalVelocityExplorer } from './TerminalVelocityExplorer';

// ─────────────────────────────────────────────────────────────────────────────
// Pre-lesson questions (from the lesson's opening "Questions" section)
// ─────────────────────────────────────────────────────────────────────────────

const UG_QUESTIONS: QuizQuestion[] = [
  {
    id: 'ug1',
    prompt:
      "Two spheres have identical size and shape, but one has ten times the mass of the other. Released from the same altitude in Earth's atmosphere — do they still reach the ground at the same time?",
    options: [
      { id: 'a', text: 'Yes — mass cancels out of the equation of motion' },
      { id: 'b', text: 'No — the heavier sphere lands first' },
      { id: 'c', text: 'No — the lighter sphere lands first' },
    ],
    correctId: 'b',
    explanation:
      'Mass cancels only in a vacuum. With drag, terminal speed goes as √m, so the heavier sphere reaches a higher terminal speed and lands first. Part 7 derives exactly this.',
  },
  {
    id: 'ug2',
    prompt: 'A falling object approaches terminal velocity. At that moment, which statement is correct?',
    options: [
      { id: 'a', text: 'Gravity has disappeared' },
      { id: 'b', text: 'The drag force has disappeared' },
      { id: 'c', text: 'The net force is approximately zero' },
      { id: 'd', text: 'The velocity is zero' },
    ],
    correctId: 'c',
    explanation:
      'Both forces are present and large — they have simply come into balance, so dv/dt ≈ 0. Terminal velocity is a statement about net force, not about either force individually.',
  },
  {
    id: 'ug3',
    prompt:
      'If the speed of an object doubles and quadratic drag applies, by what factor does the magnitude of the drag force change?',
    options: [
      { id: 'a', text: '2' },
      { id: 'b', text: '4' },
      { id: 'c', text: '8' },
      { id: 'd', text: 'It is unchanged' },
    ],
    correctId: 'b',
    explanation: 'F_d ∝ v², so doubling v multiplies the drag force by 2² = 4.',
  },
  {
    id: 'ug4',
    prompt:
      'Suppose a simulation uses a time step of Δt = 1 s. Would you expect the result to be identical to one using Δt = 0.001 s?',
    options: [
      { id: 'a', text: 'Yes — the physics is the same either way' },
      { id: 'b', text: 'No — discretisation error depends on Δt' },
    ],
    correctId: 'b',
    explanation:
      'The physical law is identical; the approximation to it is not. Truncation error scales with Δt, which is what the convergence test in Part 3 measures.',
  },
  {
    id: 'ug5',
    prompt: 'If we make Δt smaller and smaller, will a numerical simulation always become perfectly accurate?',
    options: [
      { id: 'a', text: 'Yes — error goes to zero in the limit' },
      { id: 'b', text: 'No — round-off and model error do not vanish with Δt' },
    ],
    correctId: 'b',
    explanation:
      'Smaller steps shrink truncation error but accumulate more round-off, and no time step can repair a model that omits the physics. Part 4 separates the three.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const CONTENTS = [
  { id: 'part-1', label: 'Start from the governing equation' },
  { id: 'part-2', label: 'Equation to computational model' },
  { id: 'part-3', label: 'Analytical vs. numerical' },
  { id: 'part-4', label: 'Numerical error' },
  { id: 'part-5', label: 'Quadratic air resistance' },
  { id: 'part-6', label: 'The new differential equation' },
  { id: 'part-7', label: 'Terminal velocity' },
  { id: 'part-8', label: 'What should the graph look like?' },
  { id: 'part-9', label: 'Euler–Cromer' },
  { id: 'part-10', label: 'Runge–Kutta methods' },
  { id: 'part-11', label: 'The atmosphere is not constant' },
  { id: 'part-12', label: 'Gravity is not constant either' },
  { id: 'part-13', label: 'The more complete model' },
  { id: 'part-14', label: 'Verification vs. validation' },
  { id: 'part-15', label: 'The Reynolds number' },
];

export const FallingLessonUG: React.FC = () => {
  return (
    <section className="py-12 bg-cream border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Lesson header */}
        <div className="max-w-3xl space-y-4 mb-10">
          <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
            <BookOpen className="w-4 h-4 text-gold-hover" />
            <span>Lesson 1 · Undergraduate</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
            From analytical models to numerical simulation
          </h2>
          <p className="text-sm sm:text-base text-deepteal-soft font-sans">
            The high-school lesson described a falling object with{' '}
            <MathFormula latex={String.raw`a=-g`} />,{' '}
            <MathFormula latex={String.raw`v(t)=v_0-gt`} />, and{' '}
            <MathFormula latex={String.raw`y(t)=y_0+v_0t-\tfrac{1}{2}gt^2`} />. For a body falling
            near Earth's surface in a vacuum, those equations work extremely well.
          </p>

          <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
            <p className="mb-2">But real falling objects do not move through a vacuum.</p>
            <ul className="list-disc list-inside space-y-0.5 mb-3">
              <li>The atmosphere produces drag.</li>
              <li>Air density changes with altitude.</li>
              <li>Gravity itself changes with distance from Earth.</li>
              <li>Drag depends on the object's size, shape, orientation, and velocity.</li>
            </ul>
            <p className="mb-2">Once these effects are included, the question changes. Instead of asking</p>
            <p className="font-mono text-xs bg-cream border border-sage/60 rounded p-2.5 mb-2 text-deepteal">
              "Which equation should we use?"
            </p>
            <p className="mb-2">we begin asking</p>
            <p className="font-mono text-xs bg-cream border border-gold/50 rounded p-2.5 mb-2 text-deepteal">
              "What physical model should we build, and how accurately can we solve it?"
            </p>
            <p className="font-bold text-deepteal">That is the starting point of computational physics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contents rail */}
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

          {/* Lesson body */}
          <div className="lg:col-span-9 space-y-6">
            <PreLessonQuiz
              questions={UG_QUESTIONS}
              title="Before any calculation — commit to an answer"
              intro="Five questions that the rest of the lesson answers properly. Keep them in mind throughout."
              singleColumn
            />

            <Card id="part-1" eyebrow="Part 1" title="Start from the governing equation" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
              <p>
                At university level we do not want to begin with a memorised kinematic equation. We
                begin with the physical law governing the system. Newton's second law gives
              </p>
              <Eq latex={String.raw`\sum F = ma`} />
              <p>For one-dimensional vertical motion,</p>
              <Eq latex={String.raw`m\frac{d^2y}{dt^2}=\sum F_y`} />
              <p>
                and since <MathFormula latex={String.raw`v=\frac{dy}{dt}`} />, we can also write
              </p>
              <Eq latex={String.raw`m\frac{dv}{dt}=\sum F_y`} />
              <p className="font-semibold text-deepteal">
                This differential equation is the foundation of our simulation.
              </p>

              <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                  The simplest model: gravity only
                </p>
                <p className="text-xs">
                  With upward defined as positive, <MathFormula latex={String.raw`F_g=-mg`} />, so{' '}
                  <MathFormula latex={String.raw`m\frac{dv}{dt}=-mg`} />. The mass cancels:
                </p>
                <Eq latex={String.raw`\frac{dv}{dt}=-g \qquad\text{and therefore}\qquad \frac{d^2y}{dt^2}=-g`} />
                <p className="text-xs">Integrating gives the familiar analytical solution,</p>
                <Eq latex={String.raw`v(t)=v_0-gt \qquad y(t)=y_0+v_0t-\tfrac{1}{2}gt^2`} />
                <p className="text-xs italic">
                  So for constant gravity and no atmosphere, there is still no compelling reason to
                  use a numerical simulation.
                </p>
              </div>
            </Card>

            <Card id="part-2" eyebrow="Part 2" title="From an equation to a computational model">
              <p>
                A computer cannot literally move continuously through time. Instead we divide time
                into small intervals <MathFormula latex={String.raw`t_0, t_1, t_2, \dots`} />{' '}
                separated by a time step <MathFormula latex={String.raw`\Delta t`} />, so that{' '}
                <MathFormula latex={String.raw`t_{n+1}=t_n+\Delta t`} />. At every step the computer
                calculates the current acceleration and uses it to estimate the next velocity and
                position — converting a continuous differential equation into a sequence of
                numerical calculations.
              </p>

              <p className="font-semibold text-deepteal pt-1">Euler's method</p>
              <p>
                Since <MathFormula latex={String.raw`a=\frac{dv}{dt}`} />, we approximate
              </p>
              <Eq latex={String.raw`\frac{dv}{dt}\approx\frac{v_{n+1}-v_n}{\Delta t} \quad\Longrightarrow\quad v_{n+1}=v_n+a_n\Delta t`} />
              <p>Similarly,</p>
              <Eq latex={String.raw`\frac{dy}{dt}\approx\frac{y_{n+1}-y_n}{\Delta t} \quad\Longrightarrow\quad y_{n+1}=y_n+v_n\Delta t`} />
              <p>Together, these are the explicit Euler method:</p>
              <Eq latex={String.raw`\boxed{\;v_{n+1}=v_n+a_n\Delta t \qquad y_{n+1}=y_n+v_n\Delta t\;}`} />

              <p className="font-semibold text-deepteal pt-1">What does the subscript n mean?</p>
              <SymbolTable
                rows={[
                  { symbol: 'n', meaning: 'Current numerical step' },
                  { symbol: 'n+1', meaning: 'Next numerical step' },
                  { symbol: 'y_n', meaning: 'Position at the current step' },
                  { symbol: 'v_n', meaning: 'Velocity at the current step' },
                  { symbol: 'a_n', meaning: 'Acceleration calculated at the current step' },
                  { symbol: String.raw`\Delta t`, meaning: 'Numerical time step' },
                ]}
              />
            </Card>

            <Card id="part-3" eyebrow="Part 3" title="Analytical solution vs. numerical solution">
              <p>
                Consider an object released from rest from{' '}
                <MathFormula latex={String.raw`y_0=50\ \text{m}`} />. The analytical model gives
              </p>
              <Eq latex={String.raw`y(t)=50-\tfrac{1}{2}(9.81)t^2`} />
              <p>
                This is exact <em>within the assumptions of the model</em>. Euler's method produces
                an approximation, and the difference between the two is an excellent opportunity to
                test the numerical method itself.
              </p>
              <p>
                Running the same drop at{' '}
                <MathFormula latex={String.raw`\Delta t = 1,\ 0.5,\ 0.1,\ 0.01,\ 0.001\ \text{s}`} />{' '}
                and recording the predicted impact time each time is called a{' '}
                <strong className="text-deepteal">convergence test</strong>. A trustworthy simulation
                should demonstrate that its important predictions become stable as the numerical
                resolution is increased.
              </p>
            </Card>

            <NumericalExperiment />

            <Card id="part-4" eyebrow="Part 4" title="Numerical error" icon={<AlertTriangle className="w-5 h-5 text-gold-hover" />}>
              <p className="font-semibold text-deepteal">
                A simulation result is not automatically correct simply because a computer produced
                it.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1.5">
                    Truncation
                  </p>
                  <p className="text-xs">
                    Euler approximates a continuously changing function with finite steps; the
                    neglected higher-order terms produce truncation error. For explicit Euler the
                    accumulated global error is generally first order,{' '}
                    <MathFormula latex={String.raw`O(\Delta t)`} />. Reducing{' '}
                    <MathFormula latex={String.raw`\Delta t`} /> by ten reduces it by roughly ten —
                    in the expected convergence regime.
                  </p>
                </div>
                <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1.5">
                    Round-off
                  </p>
                  <p className="text-xs">
                    Computers store numbers with finite precision. Values such as{' '}
                    <MathFormula latex={String.raw`\tfrac{1}{3}`} />,{' '}
                    <MathFormula latex={String.raw`\pi`} />,{' '}
                    <MathFormula latex={String.raw`\sqrt{2}`} /> cannot generally be represented
                    exactly in binary. Each operation adds a tiny error — negligible for one falling
                    body, important across billions of operations.
                  </p>
                </div>
                <div className="bg-cream border border-gold/50 rounded-lg p-3.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                    Model
                  </p>
                  <p className="text-xs">
                    The error that <em>cannot</em> be fixed by decreasing{' '}
                    <MathFormula latex={String.raw`\Delta t`} />. If the physical model is
                    incomplete, a perfectly executed numerical solution can still disagree with
                    reality. <MathFormula latex={String.raw`a=-9.81`} /> m/s² may be solved to
                    extreme precision and still ignore atmospheric drag.
                  </p>
                </div>
              </div>
            </Card>

            <Card id="part-5" eyebrow="Part 5" title="Adding quadratic air resistance" icon={<Waves className="w-5 h-5 text-gold-hover" />}>
              <p>
                For many objects moving through air at sufficiently high Reynolds number, a commonly
                used drag model for the <em>magnitude</em> of the force is
              </p>
              <Eq latex={String.raw`F_d=\tfrac{1}{2}\rho C_d A v^2`} />
              <p>
                However, drag must always oppose the direction of motion. For one-dimensional signed
                velocity, a convenient expression is
              </p>
              <Eq latex={String.raw`F_d=-\tfrac{1}{2}\rho C_d A\, v|v|`} />
              <p>
                If the object is moving downward then <MathFormula latex={String.raw`v<0`} />, and
                the drag force points upward automatically — the sign takes care of itself.
              </p>
              <SymbolTable
                rows={[
                  { symbol: 'F_d', meaning: 'Drag force', unit: 'N' },
                  { symbol: String.raw`\rho`, meaning: 'Fluid density', unit: 'kg/m³' },
                  { symbol: 'C_d', meaning: 'Drag coefficient', unit: 'dimensionless' },
                  { symbol: 'A', meaning: 'Reference cross-sectional area', unit: 'm²' },
                  { symbol: 'v', meaning: 'Velocity', unit: 'm/s' },
                  { symbol: 'm', meaning: 'Object mass', unit: 'kg' },
                ]}
              />
              <p className="text-xs italic">
                The drag coefficient <MathFormula latex={String.raw`C_d`} /> depends on the object's
                geometry, orientation, surface properties, and flow conditions.
              </p>
            </Card>

            <Card id="part-6" eyebrow="Part 6" title="The new differential equation">
              <p>With gravity and quadratic drag,</p>
              <Eq latex={String.raw`m\frac{dv}{dt}=-mg-\tfrac{1}{2}\rho C_d A\,v|v|`} />
              <p>and therefore</p>
              <Eq latex={String.raw`\frac{dv}{dt}=-g-\frac{\rho C_d A}{2m}v|v|`} />
              <p>
                Together with <MathFormula latex={String.raw`\frac{dy}{dt}=v`} />, we now have a
                coupled system of first-order differential equations:
              </p>
              <Eq latex={String.raw`\frac{dy}{dt}=v \qquad\qquad \frac{dv}{dt}=-g-\frac{\rho C_d A}{2m}v|v|`} />
              <p>
                This form is particularly useful computationally. At every time step the simulation
                knows <MathFormula latex={String.raw`y`} /> and <MathFormula latex={String.raw`v`} />
                . It uses them to calculate the derivatives, advances the system slightly, and
                repeats.
              </p>
            </Card>

            <Card id="part-7" eyebrow="Part 7" title="Terminal velocity">
              <p>
                As an object accelerates downward its speed increases. Because{' '}
                <MathFormula latex={String.raw`F_d\propto v^2`} />, the drag force grows too.
                Eventually the upward drag balances the downward gravitational force, and at that
                instant <MathFormula latex={String.raw`\frac{dv}{dt}=0`} />. The object is no longer
                accelerating — its velocity becomes approximately constant.
              </p>
              <p>Comparing force magnitudes for downward motion,</p>
              <Eq latex={String.raw`mg=\tfrac{1}{2}\rho C_d A v_t^2 \quad\Longrightarrow\quad v_t=\sqrt{\frac{2mg}{\rho C_d A}}`} />
              <p>
                Here <MathFormula latex={String.raw`v_t`} /> denotes the <em>magnitude</em> of
                terminal velocity. With the upward-positive convention, the actual velocity during
                downward terminal motion is <MathFormula latex={String.raw`v=-v_t`} />.
              </p>

              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-2">
                  What the equation predicts
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <li>
                    Increasing <MathFormula latex="m" /> <strong className="text-deepteal">increases</strong> terminal speed.
                  </li>
                  <li>
                    Increasing <MathFormula latex="A" /> <strong className="text-deepteal">decreases</strong> terminal speed.
                  </li>
                  <li>
                    Increasing <MathFormula latex={String.raw`\rho`} /> <strong className="text-deepteal">decreases</strong> terminal speed.
                  </li>
                  <li>
                    Increasing <MathFormula latex="C_d" /> <strong className="text-deepteal">decreases</strong> terminal speed.
                  </li>
                </ul>
                <p className="text-xs mt-2 italic">
                  This is why a parachute works: opening one dramatically increases the effective
                  area <MathFormula latex="A" /> and changes the aerodynamic drag characteristics,
                  reducing terminal speed.
                </p>
              </div>
            </Card>

            <TerminalVelocityExplorer />

            <Card id="part-8" eyebrow="Part 8" title="What should the graph look like?">
              <p>
                Before running the simulation, predict the shape of the velocity–time graph. In a
                vacuum <MathFormula latex={String.raw`v(t)=v_0-gt`} />, so velocity changes linearly.
                With drag, the speed initially increases rapidly, but the growing drag reduces the
                magnitude of the acceleration until{' '}
                <MathFormula latex={String.raw`v(t)\to -v_t`} />. The second curve approaches a
                limiting velocity rather than decreasing without bound.
              </p>
              <Predict
                items={[
                  'Which curve initially has the larger acceleration magnitude?',
                  <>
                    At <MathFormula latex="t=0" />, how large is the drag force if the object is
                    released from rest?
                  </>,
                  'Why does the curve with drag begin similarly to the vacuum curve?',
                  'Why does it eventually flatten?',
                ]}
              />
            </Card>

            <Card id="part-9" eyebrow="Part 9" title="The Euler–Cromer method" icon={<GitCompare className="w-5 h-5 text-gold-hover" />}>
              <p>A small modification of Euler's method updates velocity first, then uses it:</p>
              <Eq latex={String.raw`v_{n+1}=v_n+a_n\Delta t \qquad\text{then}\qquad y_{n+1}=y_n+v_{n+1}\Delta t`} />
              <p>Notice the difference:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-deepteal-soft mb-1.5">
                    Explicit Euler
                  </p>
                  <MathFormula latex={String.raw`y_{n+1}=y_n+v_n\Delta t`} className="text-deepteal" />
                </div>
                <div className="bg-cream border border-gold/50 rounded-lg p-3 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-gold-hover mb-1.5">
                    Euler–Cromer
                  </p>
                  <MathFormula latex={String.raw`y_{n+1}=y_n+v_{n+1}\Delta t`} className="text-deepteal" />
                </div>
              </div>
              <p>
                The difference appears minor, but the numerical behaviour can be substantially
                different for some dynamical systems. This raises an important computational
                question:
              </p>
              <p className="bg-cream border-l-2 border-gold rounded-r-lg p-3 font-sans font-semibold text-deepteal text-sm">
                Does the numerical method itself influence the physics we observe?
              </p>
              <p className="text-xs italic">
                The physical laws have not changed. Only the algorithm has changed. Yet the
                numerical predictions may differ.
              </p>
            </Card>

            <Card id="part-10" eyebrow="Part 10" title="Runge–Kutta methods">
              <p>
                Euler's method estimates the derivative using information from essentially one point
                during each time interval. More advanced algorithms estimate how the derivative
                changes <em>across</em> the interval. The most widely used is the classical
                fourth-order Runge–Kutta method, RK4. For{' '}
                <MathFormula latex={String.raw`\frac{dx}{dt}=f(t,x)`} />, RK4 evaluates the slope
                four times per step:
              </p>
              <Eq latex={String.raw`\begin{aligned}k_1&=f(t_n,x_n)\\[2pt] k_2&=f\!\left(t_n+\tfrac{\Delta t}{2},\,x_n+\tfrac{\Delta t}{2}k_1\right)\\[2pt] k_3&=f\!\left(t_n+\tfrac{\Delta t}{2},\,x_n+\tfrac{\Delta t}{2}k_2\right)\\[2pt] k_4&=f\!\left(t_n+\Delta t,\,x_n+\Delta t\,k_3\right)\end{aligned}`} />
              <p>The next value is then estimated using</p>
              <Eq latex={String.raw`x_{n+1}=x_n+\frac{\Delta t}{6}\left(k_1+2k_2+2k_3+k_4\right)`} />
              <p className="font-semibold text-deepteal">
                The idea matters more than memorising the formula: instead of trusting one slope,
                RK4 samples the evolution of the system several times during each time step.
              </p>
              <p>
                For sufficiently smooth problems RK4 has global error of order{' '}
                <MathFormula latex={String.raw`O(\Delta t^4)`} />, compared with{' '}
                <MathFormula latex={String.raw`O(\Delta t)`} /> for explicit Euler. Scroll back to
                the experiment above and switch the method columns on to see it.
              </p>
              <Predict
                items={[
                  'Which method converges more rapidly?',
                  'Can RK4 with a relatively large time step outperform Euler with a much smaller one?',
                  'Which method requires more force evaluations during each step?',
                  'Is the most accurate method always the best method?',
                ]}
              />
              <p className="text-xs">
                That last question is the important one. Scientific computing involves a trade-off
                between <strong className="text-deepteal">accuracy</strong> and{' '}
                <strong className="text-deepteal">computational cost</strong>.
              </p>
            </Card>

            <Card id="part-11" eyebrow="Part 11" title="The atmosphere is not constant">
              <p>
                So far we have treated air density as constant. But atmospheric density decreases
                significantly with altitude. A simplified model is
              </p>
              <Eq latex={String.raw`\rho(h)=\rho_0 e^{-h/H}`} />
              <SymbolTable
                unitHeader="Typical interpretation"
                rows={[
                  { symbol: String.raw`\rho(h)`, meaning: 'Density at altitude h', unit: 'kg/m³' },
                  { symbol: String.raw`\rho_0`, meaning: 'Density at reference altitude', unit: 'near sea-level value' },
                  { symbol: 'h', meaning: 'Altitude', unit: 'm' },
                  { symbol: 'H', meaning: 'Atmospheric scale height', unit: 'm' },
                ]}
              />
              <p>The drag force now becomes</p>
              <Eq latex={String.raw`F_d=-\tfrac{1}{2}\rho(h)C_d A\,v|v| \quad\Longrightarrow\quad \frac{dv}{dt}=-g-\frac{\rho_0 e^{-h/H}C_d A}{2m}v|v|`} />
              <p className="font-semibold text-deepteal">
                Acceleration now depends on both <MathFormula latex="v" /> and{' '}
                <MathFormula latex="h" />. The system is becoming considerably more realistic.
              </p>
            </Card>

            <Card id="part-12" eyebrow="Part 12" title="Gravity is not actually constant either">
              <p>
                The approximation <MathFormula latex={String.raw`g=9.81`} /> m/s² works well near
                Earth's surface. At large altitude, gravitational acceleration changes with distance
                from Earth's centre. Newton's law of universal gravitation gives
              </p>
              <Eq latex={String.raw`F_g=-\frac{GMm}{r^2} \quad\Longrightarrow\quad g(r)=\frac{GM}{r^2}`} />
              <p>
                If <MathFormula latex={String.raw`r=R_E+h`} />, then
              </p>
              <Eq latex={String.raw`g(h)=\frac{GM}{(R_E+h)^2}`} />
              <SymbolTable
                rows={[
                  { symbol: 'G', meaning: 'Universal gravitational constant' },
                  { symbol: 'M', meaning: 'Mass of Earth' },
                  { symbol: 'R_E', meaning: 'Radius of Earth' },
                  { symbol: 'h', meaning: "Altitude above Earth's surface" },
                  { symbol: 'r', meaning: "Distance from Earth's centre" },
                ]}
              />
              <p>
                At low altitude <MathFormula latex={String.raw`h\ll R_E`} />, so treating{' '}
                <MathFormula latex="g" /> as approximately constant is reasonable. At sufficiently
                large altitude, it is not.
              </p>
            </Card>

            <Card id="part-13" eyebrow="Part 13" title="The more complete falling-body model" icon={<Layers className="w-5 h-5 text-gold-hover" />}>
              <p>
                Combining variable gravity and altitude-dependent atmospheric drag, with{' '}
                <MathFormula latex={String.raw`r=R_E+h`} />:
              </p>
              <Eq latex={String.raw`\frac{dh}{dt}=v \qquad \frac{dv}{dt}=-\frac{GM}{(R_E+h)^2}-\frac{\rho_0 e^{-h/H}C_d A}{2m}v|v|`} />
              <p>This single equation contains several interacting effects:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Gravity changes with altitude.</li>
                <li>Atmospheric density changes with altitude.</li>
                <li>Drag changes with atmospheric density.</li>
                <li>Drag changes with velocity.</li>
                <li>Velocity changes because of the net force.</li>
                <li>Position changes because of velocity.</li>
              </ul>
              <p className="font-semibold text-deepteal">
                Each variable affects another. This is exactly the kind of system for which
                computational simulation becomes powerful.
              </p>

              <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-1.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                  Do we need simulation now?
                </p>
                <p className="text-xs">
                  For the idealised constant-<MathFormula latex="g" /> falling body — no. For
                  quadratic drag with constant atmospheric properties, analytical solutions can
                  still be obtained for certain cases. But once we combine{' '}
                  <MathFormula latex="g=g(h)" />, <MathFormula latex={String.raw`\rho=\rho(h)`} />,{' '}
                  <MathFormula latex={String.raw`C_d=C_d(\text{flow conditions})`} />, and possibly
                  changing geometry or external forces, analytical solutions quickly become
                  inconvenient or unavailable.
                </p>
                <p className="text-xs font-semibold text-deepteal">
                  At this point, numerical simulation becomes the natural approach.
                </p>
              </div>
            </Card>

            <Card id="part-14" eyebrow="Part 14" title="Verification vs. validation" icon={<ShieldCheck className="w-5 h-5 text-gold-hover" />}>
              <p className="font-semibold text-deepteal">
                A sophisticated simulation can produce beautiful graphs and still be wrong. Two
                different questions must be asked.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1">
                    Verification
                  </p>
                  <p className="text-xs italic mb-2">
                    Did we solve our mathematical equations correctly?
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Compare with an analytical solution when drag is removed.</li>
                    <li>
                      Reduce <MathFormula latex={String.raw`\Delta t`} /> and perform a convergence
                      study.
                    </li>
                    <li>Compare Euler and RK4.</li>
                    <li>Check conservation laws where appropriate.</li>
                    <li>Check units and dimensions.</li>
                  </ul>
                </div>
                <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-deepteal mb-1">
                    Validation
                  </p>
                  <p className="text-xs italic mb-2">
                    Do our mathematical equations represent the real physical system well enough?
                  </p>
                  <p className="text-xs">
                    Validation might involve comparing the simulation with experimental
                    measurements, published data, laboratory observations, or measurements from a
                    real falling object.
                  </p>
                </div>
              </div>
              <p className="bg-cream border-l-2 border-gold rounded-r-lg p-3 font-sans font-semibold text-deepteal text-sm">
                A program can be numerically correct but physically inaccurate. That distinction is
                fundamental in scientific simulation.
              </p>
            </Card>

            <Card id="part-15" eyebrow="Part 15" title="A useful dimensionless quantity — the Reynolds number">
              <p>
                The simple statement <MathFormula latex={String.raw`F_d\propto v^2`} /> does not
                apply equally well to every flow regime. One quantity that helps characterise fluid
                flow is the Reynolds number:
              </p>
              <Eq latex={String.raw`\mathrm{Re}=\frac{\rho v L}{\mu}`} />
              <SymbolTable
                rows={[
                  { symbol: String.raw`\rho`, meaning: 'Fluid density', unit: 'kg/m³' },
                  { symbol: 'v', meaning: 'Characteristic speed', unit: 'm/s' },
                  { symbol: 'L', meaning: 'Characteristic length', unit: 'm' },
                  { symbol: String.raw`\mu`, meaning: 'Dynamic viscosity', unit: 'Pa·s' },
                ]}
              />
              <p>
                The Reynolds number compares the relative importance of inertial and viscous effects
                in a flow. At very low Reynolds number, drag can behave approximately linearly with
                velocity, <MathFormula latex={String.raw`F_d\propto v`} />. In many
                higher-Reynolds-number situations a quadratic model,{' '}
                <MathFormula latex={String.raw`F_d\propto v^2`} />, is more appropriate over a
                useful range.
              </p>
              <p className="font-semibold text-deepteal">
                Therefore even the choice of drag equation is part of the modelling process.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Closing material — shown below the Python lab
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'A', physics: 'Constant gravity, no drag' },
  { id: 'B', physics: 'Constant gravity, quadratic drag' },
  { id: 'C', physics: 'Constant gravity, altitude-dependent atmosphere' },
  { id: 'D', physics: 'Variable gravity and altitude-dependent atmosphere' },
];

export const FallingLessonUGClosing: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-cream-card border border-sage rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <ListChecks className="w-5 h-5 text-gold-hover" />
        <span>Final investigation: build the model in layers</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Instead of immediately constructing the most complicated simulation, build four models and
        run all of them from the same initial altitude. Plot{' '}
        <MathFormula latex="h(t)" />, <MathFormula latex="v(t)" />, and{' '}
        <MathFormula latex="a(t)" /> for each.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[320px]">
          <thead>
            <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
              <th className="text-left py-2 pr-4 font-bold">Model</th>
              <th className="text-left py-2 font-bold">Included physics</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.id} className="border-b border-sage/30">
                <td className="py-2 pr-4">
                  <span className="font-mono font-bold text-deepteal">{m.id}</span>
                </td>
                <td className="py-2 text-deepteal-soft font-sans">{m.physics}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="list-decimal list-inside space-y-1 text-xs text-deepteal-soft font-sans pt-1">
        <li>Which additional physical effect changes the prediction the most?</li>
        <li>Under what conditions is Model A sufficient?</li>
        <li>When does adding more complexity make a meaningful difference?</li>
        <li>Does the most complicated model automatically produce the most trustworthy prediction?</li>
        <li>Which uncertainties come from the numerical method?</li>
        <li>Which uncertainties come from the physical model?</li>
      </ol>
    </div>

    <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
        Key takeaway
      </p>
      <p className="text-sm text-sage-light leading-relaxed">
        The important transition from introductory physics to computational physics is not simply
        the introduction of more complicated equations. It is a change in how we approach a physical
        problem.
      </p>
      <div className="space-y-2.5 py-1">
        <div className="bg-deepteal-dark/60 border border-sage/20 rounded-lg p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-sage/70 mb-1.5">
            For the simplest falling body
          </p>
          <p className="font-mono text-xs text-cream">physical law → analytical solution</p>
        </div>
        <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gold/80 mb-1.5">
            For a more realistic falling body
          </p>
          <p className="font-mono text-xs text-cream leading-relaxed">
            physical assumptions → differential equations → numerical method → simulation →
            verification → physical interpretation
          </p>
        </div>
      </div>
      <p className="text-sm text-sage-light leading-relaxed font-semibold">
        The computer does not replace the physics. It allows us to explore the consequences of the
        physics when the equations can no longer be handled conveniently by analytical methods.
      </p>
    </div>
  </div>
);
