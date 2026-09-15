import React from 'react';
import { BrickWall, Cpu, FlaskConical, Gauge, RefreshCw, Ruler, Shapes, Sigma } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { TunnelingSimulator } from './TunnelingSimulator';
import { TunnelingInstrumentWidget } from './TunnelingInstrumentWidget';

const TUNNELING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'qt1',
    prompt: "A quantum particle with less energy than a barrier's height reaches that barrier. What does quantum mechanics predict?",
    options: [
      { id: 'a', text: 'The particle definitely bounces back, just like a classical ball' },
      { id: 'b', text: "The particle definitely passes through, as if the barrier weren't there" },
      { id: 'c', text: 'There is some probability the particle passes through, and some probability it bounces back' },
    ],
    correctId: 'c',
    explanation:
      "Quantum mechanics gives both outcomes a probability. The wavefunction doesn't stop dead at the barrier: it dies away inside it, and if the barrier is thin enough, a little of it is still there on the far side — that leftover is the chance of tunneling through.",
  },
  {
    id: 'qt2',
    prompt: "You make the barrier thicker, keeping its height and the particle's energy the same. What happens to the chance of tunneling through?",
    options: [
      { id: 'a', text: 'It increases' },
      { id: 'b', text: 'It decreases' },
      { id: 'c', text: 'It stays exactly the same' },
    ],
    correctId: 'b',
    explanation:
      'It decreases — and fast. Inside the barrier the wavefunction shrinks exponentially, so every extra slice of width multiplies the chance by the same small factor. For an electron 0.5 eV short of the top, one extra 0.1 nm roughly halves it.',
  },
  {
    id: 'qt3',
    prompt: 'Instead of one simple barrier, the particle now faces two barriers in a row, close together. Compared to the single-barrier case, predicting the outcome is:',
    options: [
      { id: 'a', text: 'Just as simple, since the same formula applies twice' },
      { id: 'b', text: 'Somewhat simpler, since the barriers average out' },
      { id: 'c', text: "Noticeably more complex, with new effects that don't appear for a single barrier" },
    ],
    correctId: 'c',
    explanation:
      'Noticeably more complex. The wave can bounce back and forth between the two barriers, and at special energies those echoes line up so well that the pair lets almost everything through — far more than either barrier alone. Nothing in the single-barrier formula predicts that.',
  },
];

const CONTENTS = [
  { id: 'qt-part-1', label: 'Describing a particle and a barrier' },
  { id: 'qt-part-2', label: 'One governing rule' },
  { id: 'qt-part-3', label: 'Building the mathematical model' },
  { id: 'qt-part-4', label: 'Different barriers' },
  { id: 'qt-part-5', label: 'Why equations eventually fail' },
  { id: 'qt-part-6', label: 'How a simulation thinks' },
  { id: 'qt-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe a quantum particle by its energy E and wavefunction ψ(x), and a barrier by its height V₀ and width L.',
  'Read the Schrödinger equation: free waves outside a barrier, a decaying wave inside it.',
  'Use the exact transmission formula for a rectangular barrier, and its thick-barrier shortcut.',
  'Predict how width, height and energy change the chance of tunneling.',
  'Recognize why irregular, multiple and changing barriers, and interacting particles, need simulation.',
  'Build the grid-and-time-step loop a wave-packet simulation runs.',
];

const BARRIER_TABLE = [
  { change: 'Wider barrier (larger L)', result: 'Tunneling probability drops off exponentially' },
  { change: 'Taller barrier (larger V₀)', result: 'Tunneling probability also drops sharply' },
  { change: 'Energy E close to V₀', result: 'Tunneling becomes much more likely' },
  { change: 'Energy E above V₀', result: 'Particle mostly passes over, with some reflection instead' },
];

const ASSUMPTIONS = [
  'Exactly one barrier',
  'A simple rectangular shape',
  "A barrier that doesn't change over time",
  'Exactly one particle, with no other particles nearby',
  'A precisely known energy',
];

const APPLICATIONS = [
  'Scanning tunneling microscope design and image interpretation',
  'Tunnel diodes and flash memory devices',
  'Modeling alpha decay and nuclear fusion rates',
  'Josephson junctions in quantum computing hardware',
  'Semiconductor and transistor design at nanometer scales',
];

const SIM_STEPS = [
  { code: 'V(x, t)', label: "Calculate the local potential energy at that point, however it's shaped" },
  { code: '(ψᵢ₊₁ − 2ψᵢ + ψᵢ₋₁) / Δx²', label: 'Calculate how the wavefunction is curving at that point' },
  { code: 'ψ_new = ψ_old − 2iΔt·Hψ/ħ', label: 'Advance the wavefunction forward by a small time step, using the Schrödinger equation' },
  { code: '|ψ|²', label: 'Compute the probability density from the updated wavefunction' },
  { code: 't += Δt, every point', label: 'Repeat for every point on the grid, every step' },
];

export const TunnelingLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <BrickWall className="w-4 h-4 text-gold-hover" />
          <span>Lesson 11 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">Quantum tunneling — when do we need simulation?</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine rolling a ball toward a hill. If the ball doesn&apos;t have enough energy to climb over the top, classical physics
                is unambiguous: it slows down, stops, and rolls back. It never appears on the far side. Now shrink the ball down to the
                size of an electron. Astonishingly, quantum mechanics says there is a real chance the electron shows up on the other side
                of the hill anyway — not by climbing over, but by tunneling straight through. Simple enough to state — until someone
                asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>Exactly how likely is the particle to make it through a given barrier?</li>
                <li>Can you predict that probability precisely, before running any experiment?</li>
                <li>What if the barrier isn&apos;t a simple, uniform wall, but some irregular shape?</li>
                <li>What if there are two barriers in a row, close together?</li>
                <li>What if the barrier itself is changing over time?</li>
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
            <TunnelingInstrumentWidget />
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
            questions={TUNNELING_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card id="qt-part-1" eyebrow="Part 1" title="Describing a quantum particle and a barrier" icon={<Ruler className="w-5 h-5 text-gold-hover" />}>
            <p>Every particle in this lesson is described by its energy, and every barrier is described by its height and width.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Particle energy</p>
                <p className="text-xs">
                  The energy the particle carries as it approaches the barrier. Written <MathFormula latex="E" /> — for electrons,
                  usually in electronvolts (1 eV ≈ 1.6 × 10⁻¹⁹ J).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Barrier height and width</p>
                <p className="text-xs">
                  How tall the energy barrier is, and how wide. Written <MathFormula latex="V_0" /> (in eV) and{' '}
                  <MathFormula latex="L" /> (in nanometres).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Wavefunction</p>
                <p className="text-xs">
                  Instead of a definite position, a quantum particle is described by a wavefunction <MathFormula latex={String.raw`\psi(x)`} />,
                  whose squared size, <MathFormula latex={String.raw`|\psi(x)|^2`} />, gives the probability of finding the particle at each
                  point.
                </p>
              </div>
            </div>
          </Card>

          <Card id="qt-part-2" eyebrow="Part 2" title="One governing rule" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
            <p>
              Just as waves and fields are governed by one simple addition rule, every quantum particle is governed by one equation, the
              time-independent Schrödinger equation:
            </p>
            <Eq
              latex={String.raw`-\frac{\hbar^2}{2m}\,\frac{d^2\psi}{dx^2} + V(x)\,\psi = E\,\psi`}
              note="ħ = h/2π, Planck's constant divided by 2π — “h-bar”"
            />
            <p className="font-semibold text-deepteal">That&apos;s it — one equation, applied everywhere.</p>
            <p className="text-xs">
              Outside the barrier the particle behaves like a free wave; inside a barrier taller than its energy, the wavefunction
              doesn&apos;t oscillate but instead decays:
            </p>
            <Eq latex={String.raw`\psi_{\text{outside}} = A\,e^{ikx} + B\,e^{-ikx}, \qquad k = \frac{\sqrt{2mE}}{\hbar}`} />
            <Eq latex={String.raw`\psi_{\text{inside}} = C\,e^{-\kappa x} + D\,e^{\kappa x}, \qquad \kappa = \frac{\sqrt{2m(V_0 - E)}}{\hbar}`} />
            <p className="text-xs">
              Matching these pieces smoothly at the edges of the barrier is what determines how much of the wave gets through.
            </p>
          </Card>

          <Card id="qt-part-3" eyebrow="Part 3" title="Building the mathematical model" icon={<Gauge className="w-5 h-5 text-gold-hover" />}>
            <p className="font-semibold text-deepteal">Step 1 — One simple, rectangular barrier</p>
            <p className="text-xs">
              Suppose a particle of energy <MathFormula latex="E" /> approaches a single rectangular barrier of height{' '}
              <MathFormula latex="V_0" /> (with <MathFormula latex="V_0 > E" />) and width <MathFormula latex="L" />. Solving the
              Schrödinger equation in each of the three regions — before, inside, and after the barrier — and matching the wavefunction
              and its slope at each boundary, is a standard, exactly solvable problem.
            </p>

            <p className="font-semibold text-deepteal pt-2">Step 2 — The exact transmission probability</p>
            <p className="text-xs">This matching gives an exact, closed-form result for the probability that the particle tunnels through:</p>
            <Eq latex={String.raw`T = \left[\,1 + \frac{V_0^{\,2}\,\sinh^2(\kappa L)}{4E\,(V_0 - E)}\,\right]^{-1}, \qquad \kappa = \frac{\sqrt{2m(V_0 - E)}}{\hbar}`} />
            <SymbolTable
              rows={[
                { symbol: 'E', meaning: 'Energy of the incoming particle' },
                { symbol: 'V_0', meaning: 'Height of the barrier' },
                { symbol: 'L', meaning: 'Width of the barrier' },
                { symbol: String.raw`\kappa`, meaning: 'Decay rate of the wavefunction inside the barrier' },
                { symbol: 'T', meaning: 'Probability the particle tunnels through' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — The key behaviour</p>
            <p className="text-xs">
              For a tall, wide barrier, <MathFormula latex={String.raw`\sinh(\kappa L)`} /> is almost exactly half of{' '}
              <MathFormula latex={String.raw`e^{\kappa L}`} />, and the formula simplifies to an exponential:
            </p>
            <Eq latex={String.raw`T \approx 16\,\frac{E}{V_0}\left(1 - \frac{E}{V_0}\right) e^{-2\kappa L}`} />
            <p className="text-xs">
              The number in front is never bigger than 4, while the exponential can be a millionth or smaller, so this is often shortened
              to <MathFormula latex={String.raw`T \approx e^{-2\kappa L}`} /> — right about the exponential behaviour, though it can be off
              by that factor of up to 4.
            </p>
            <ul className="space-y-1 text-xs">
              {[
                'A wider barrier makes T shrink exponentially — even a small increase in L can make tunneling far less likely.',
                'A taller barrier (bigger V₀ − E) also shrinks T, since κ grows.',
                'T is never exactly zero, no matter how tall or wide the barrier — there is always some chance of tunneling through.',
              ].map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Worked example</p>
              <p className="text-xs">
                An electron with <MathFormula latex="E = 0.5" /> eV meets a barrier <MathFormula latex="V_0 = 1.0" /> eV high and{' '}
                <MathFormula latex="L = 0.5" /> nm wide. How likely is it to get through? For an electron,{' '}
                <MathFormula latex={String.raw`\hbar^2/2m = 0.0381`} /> eV·nm².
              </p>
              <p className="font-mono text-xs text-deepteal">κ = √((1.0 − 0.5) eV / 0.0381 eV·nm²) ≈ 3.62 nm⁻¹</p>
              <p className="font-mono text-xs text-deepteal">κL ≈ 1.81, so sinh²(κL) ≈ 8.87</p>
              <p className="font-mono text-xs text-deepteal">T = 1 / [1 + (1.0² × 8.87) / (4 × 0.5 × 0.5)] = 1 / 9.87</p>
              <p className="font-mono text-xs text-deepteal font-bold">T ≈ 0.10 — about 1 electron in 10 gets through</p>
              <p className="text-xs italic">
                Make the barrier just 0.1 nm wider and T halves, to about 5%. The shortcut gives 4 × e^(−3.62) ≈ 0.11, close to the exact
                0.10; the bare e^(−2κL) would say 0.03.
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">Do we need simulation yet?</p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For a single, simple rectangular barrier, we have an exact formula for the
                tunneling probability. Scientists use simulation when simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card id="qt-part-4" eyebrow="Part 4" title="Different barriers" icon={<Shapes className="w-5 h-5 text-gold-hover" />}>
            <p>
              The equations remain the same. Only the values of <MathFormula latex="E" />, <MathFormula latex="V_0" />, and{' '}
              <MathFormula latex="L" /> change.
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
                  {BARRIER_TABLE.map((row) => (
                    <tr key={row.change} className="border-b border-sage/30 align-top">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.change}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs italic">
              For the electron in the worked example: one extra 0.1 nm of width halves T; raising the barrier to 1.5 eV cuts it about
              five-fold; and at 0.95 eV, T climbs to 34%. Just above the top the barrier still reflects: at 1.05 eV, 58% of the wave
              bounces back, while at 2 eV, 96% gets through.
            </p>
            <Predict
              items={[
                'Why is tunneling far more noticeable for tiny particles like electrons than for anything you can see with your eyes?',
                'What new effect might appear if two identical barriers are placed close together, letting a wave bounce between them?',
                'Why might a scanning tunneling microscope be extraordinarily sensitive to the exact distance between its tip and a surface?',
              ]}
            />
            <p className="text-xs italic">Think before revealing the answer — then use the simulator below to check yourself.</p>
          </Card>

          <TunnelingSimulator />

          <Card id="qt-part-5" eyebrow="Part 5" title="Why equations eventually fail" icon={<Cpu className="w-5 h-5 text-gold-hover" />}>
            <p>So far, we have assumed:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ASSUMPTIONS.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p>Real quantum systems are usually far messier.</p>

            <p className="font-semibold text-deepteal pt-1">Irregular and multiple barriers</p>
            <p>
              Real barriers — inside a semiconductor device, or under a scanning tunneling microscope tip — are rarely simple rectangles;
              their height can vary smoothly with position. And when two or more barriers sit close together, the wave can reflect back
              and forth between them, building up sharp resonances where transmission suddenly spikes — an effect with no counterpart in
              the single-barrier formula. Two 1 eV barriers, each 0.3 nm thick and 1 nm apart, let an electron at 0.18 eV through almost
              every time, while either barrier on its own passes only 14%.
            </p>

            <p className="font-semibold text-deepteal pt-1">Changing fields and many particles</p>
            <p>
              If the barrier itself is being driven by an oscillating electric field, or if many electrons are tunneling at once and
              repelling each other, the single, fixed-shape formula no longer applies at all.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">Why simulation helps</p>
              <p className="text-xs">
                Once irregular shapes, multiple barriers, time-varying fields, and interacting particles are all involved at once, no single
                formula captures the whole picture:
              </p>
              <ul className="space-y-0.5 text-xs">
                {[
                  "The potential can take any shape along the particle's path, not just a rectangle.",
                  'The wavefunction is tracked at every point on a spatial grid, not just in three simple regions.',
                  'The wave is advanced forward in tiny time steps, letting reflections and resonances build up naturally.',
                  "Multiple particles' wavefunctions can be evolved together, including their mutual interactions.",
                ].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs">
                This feedback loop across the whole grid, repeated at every time step, quickly becomes impossible to solve analytically. A
                simulation handles this naturally by updating the wavefunction at every grid point, many small time steps at a time.
              </p>
            </div>
          </Card>

          <Card id="qt-part-6" eyebrow="Part 6" title="How a simulation thinks" icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}>
            <p>
              Instead of solving everything at once, the computer repeatedly performs, at every point on a grid — the loop the Python lab
              below runs:
            </p>
            <ol className="space-y-1.5">
              {SIM_STEPS.map((s, i) => (
                <li key={s.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-cream border border-sage/60 rounded-lg px-3 py-2">
                  <span className="font-mono text-[10px] font-bold text-gold-hover shrink-0">{i + 1}</span>
                  <span className="text-xs text-deepteal-soft flex-1 min-w-[12rem]">{s.label}</span>
                  <code className="font-mono text-[11px] text-deepteal whitespace-nowrap">{s.code}</code>
                </li>
              ))}
            </ol>
            <p className="text-xs">
              Step 3 is where the care goes. The Python lab takes a leapfrog step, using the wavefunction at the last two moments to jump to
              the next — stable as long as the time step is small enough for the grid. The simulator above handles the curvature in
              wavenumber space instead, with Fourier transforms (the split-operator method), where the curvature is exact and bigger steps
              are safe.
            </p>
            <p className="font-semibold text-deepteal">
              The buildup of reflections, resonances, and transmitted probability emerges naturally from these small steps.
            </p>
          </Card>

          <Card id="qt-part-7" eyebrow="Part 7" title="Real-world applications" icon={<FlaskConical className="w-5 h-5 text-gold-hover" />}>
            <p className="text-xs">Quantum tunneling simulations are used in:</p>
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

export const TunnelingLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">Key takeaway</p>
    <p className="text-sm text-sage-light leading-relaxed">
      A single particle facing one simple rectangular barrier has an exact formula for its tunneling probability — the result depends
      cleanly on energy, barrier height, and barrier width.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center overflow-x-auto">
      <MathFormula
        latex={String.raw`T = \left[\,1 + \frac{V_0^{\,2}\,\sinh^2(\kappa L)}{4E\,(V_0 - E)}\,\right]^{-1} \qquad \kappa = \frac{\sqrt{2m(V_0 - E)}}{\hbar}`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Irregular shapes, multiple barriers, time-varying fields, and interacting particles quickly become too complex to solve
      analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
