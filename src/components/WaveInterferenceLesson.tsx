import React from 'react';
import { AudioWaveform, Cpu, Gauge, RefreshCw, Ruler, Sigma, Speaker, Waves } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { WaveInterferenceSimulator } from './WaveInterferenceSimulator';
import { WaveInterferenceInstrumentWidget } from './WaveInterferenceInstrumentWidget';

const WAVE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'wi1',
    prompt: 'Two identical waves arrive at a point perfectly in step (crest meets crest). What happens?',
    options: [
      { id: 'a', text: 'They cancel out completely' },
      { id: 'b', text: 'They combine into a bigger wave' },
      { id: 'c', text: 'They pass through unchanged' },
      { id: 'd', text: 'One wave destroys the other' },
    ],
    correctId: 'b',
    explanation:
      'Constructive interference — the two displacements add directly, doubling the amplitude. Δφ = 0 gives amplitude 2A in Part 3.',
  },
  {
    id: 'wi2',
    prompt: 'Two identical waves arrive perfectly out of step (crest meets trough). What happens?',
    options: [
      { id: 'a', text: 'They combine into a bigger wave' },
      { id: 'b', text: 'They cancel out' },
      { id: 'c', text: 'Nothing changes' },
    ],
    correctId: 'b',
    explanation:
      "Destructive interference — one wave's crest exactly matches the other's trough, so the sum is zero at that instant.",
  },
  {
    id: 'wi3',
    prompt: 'If you add a third wave source to a two-source interference pattern, the resulting pattern is:',
    options: [
      { id: 'a', text: 'Just the old pattern, unchanged' },
      { id: 'b', text: 'Twice as simple' },
      { id: 'c', text: 'Noticeably more complex' },
    ],
    correctId: 'c',
    explanation:
      'Superposition still applies — just add the third wave in — but the pattern of constructive and destructive regions gets noticeably more intricate. This is exactly why simulation becomes useful past two sources.',
  },
];

const CONTENTS = [
  { id: 'wi-part-1', label: 'Describing a wave' },
  { id: 'wi-part-2', label: 'The principle of superposition' },
  { id: 'wi-part-3', label: 'Building the mathematical model' },
  { id: 'wi-part-4', label: 'Different phase differences' },
  { id: 'wi-part-5', label: 'Why equations eventually fail' },
  { id: 'wi-part-6', label: 'How a simulation thinks' },
  { id: 'wi-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe a wave using amplitude, wavelength, and frequency.',
  'Apply the principle of superposition to combine overlapping waves.',
  'Derive the exact two-source interference formula and its dependence on phase difference.',
  'Predict where two sources interfere constructively or destructively.',
  'Recognize why many sources, reflections, and a whole 2D surface push past what one formula can capture.',
  'Build the superposition function a real interference simulation evaluates at every grid point.',
];

const PHASE_TABLE = [
  { phi: '0°', result: 'Maximum constructive interference (2A)' },
  { phi: '90°', result: 'Partial combination (≈1.41A)' },
  { phi: '180°', result: 'Complete destructive interference (0)' },
  { phi: '270°', result: 'Partial combination (≈1.41A)' },
];

const APPLICATIONS = [
  'Noise-cancelling headphone design',
  'Concert hall and room acoustics',
  'Antenna array and radar design',
  'Optical interferometers (like those used to detect gravitational waves)',
  'Seismic imaging',
];

const SIM_STEPS = [
  { code: 'y_i = A·sin(2π(f·t − r/λ) + φ)', label: 'Calculate the contribution from each wave source' },
  { code: 'y_i for each image source', label: 'Add contributions from any reflected waves' },
  { code: 'y_total = Σ y_i', label: 'Sum everything together (superposition)' },
  { code: 't += Δt', label: 'Advance time by a small step' },
  { code: 'repeat, for every point on the grid', label: 'Repeat for every point on the grid, every step' },
];

export const WaveInterferenceLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <AudioWaveform className="w-4 h-4 text-gold-hover" />
          <span>Lesson 6 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Wave interference — when do we need simulation?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine dropping two pebbles into a still pond at the same time, a short distance
                apart. Two sets of ripples spread outward. Where they cross, something strange
                happens: in some spots the water surges higher, in others it goes almost flat.
                Simple enough to watch — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>Why do the ripples add up in some places and cancel in others?</li>
                <li>Can you predict exactly where the water will be calm before it happens?</li>
                <li>What if you dropped three pebbles instead of two?</li>
                <li>What if the two pebbles didn't drop at exactly the same moment?</li>
                <li>What if the pond had walls that reflected the ripples back?</li>
              </ul>
              <p className="font-bold text-deepteal">Suddenly, the problem becomes more interesting.</p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <WaveInterferenceInstrumentWidget />
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
            questions={WAVE_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card
            id="wi-part-1"
            eyebrow="Part 1"
            title="Describing a wave"
            icon={<Ruler className="w-5 h-5 text-gold-hover" />}
          >
            <p>Every wave in this lesson repeats itself over both space and time. Three quantities describe it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Amplitude</p>
                <p className="text-xs">
                  How tall the wave is — its maximum displacement from rest. Written{' '}
                  <MathFormula latex="A" />.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Wavelength</p>
                <p className="text-xs">
                  The distance between one crest and the next. Written <MathFormula latex="\lambda" />, units m.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Frequency</p>
                <p className="text-xs">
                  How many full waves pass a point every second. Written <MathFormula latex="f" />, units Hz.
                </p>
              </div>
            </div>
            <p className="text-xs">A single traveling wave at one point in space can be written as:</p>
            <Eq latex={String.raw`y(t) = A \cdot \sin(2\pi f \cdot t + \varphi)`} />
            <p className="text-xs italic">
              where <MathFormula latex="\varphi" /> is the phase — how far along its cycle the wave
              is at <MathFormula latex="t=0" />.
            </p>
          </Card>

          <Card
            id="wi-part-2"
            eyebrow="Part 2"
            title="The principle of superposition"
            icon={<Sigma className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              When two or more waves overlap at the same point in space, physics gives us a
              remarkably simple rule: just add their displacements together.
            </p>
            <Eq latex={String.raw`y_{total}(t) = y_1(t) + y_2(t)`} />
            <p className="font-semibold text-deepteal">
              That's it — no complicated interaction, no waves &ldquo;colliding.&rdquo; Each wave
              keeps behaving as if the other weren't there; you just add up the results at each
              point.
            </p>
            <p className="text-xs">
              This single rule is what causes both the surging peaks and the calm spots on the pond.
            </p>
          </Card>

          <Card
            id="wi-part-3"
            eyebrow="Part 3"
            title="Building the mathematical model"
            icon={<Gauge className="w-5 h-5 text-gold-hover" />}
          >
            <p className="font-semibold text-deepteal">Step 1 — Two identical sources</p>
            <p className="text-xs">
              Suppose two identical waves reach a point, differing only by phase{' '}
              <MathFormula latex="\Delta\varphi" />:
            </p>
            <Eq latex={String.raw`y_1(t) = A\sin(2\pi ft) \qquad y_2(t) = A\sin(2\pi ft + \Delta\varphi)`} />

            <p className="font-semibold text-deepteal pt-2">Step 2 — Combine them</p>
            <p className="text-xs">Adding these two waves together simplifies to an exact, closed-form result:</p>
            <Eq latex={String.raw`y_{total}(t) = 2A\cos\!\left(\frac{\Delta\varphi}{2}\right)\sin\!\left(2\pi ft + \frac{\Delta\varphi}{2}\right)`} />
            <SymbolTable
              rows={[
                { symbol: 'A', meaning: 'Amplitude of each individual wave' },
                { symbol: 'f', meaning: 'Frequency (shared by both waves)' },
                { symbol: '\\Delta\\varphi', meaning: 'Phase difference between the two waves' },
                { symbol: 'y_{total}(t)', meaning: 'Combined displacement at time t' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — Constructive and destructive interference</p>
            <p className="text-xs">
              The new amplitude is <MathFormula latex="2A\cos(\Delta\varphi/2)" />. This tells us
              everything: <MathFormula latex="\Delta\varphi=0" /> (in step) gives amplitude{' '}
              <MathFormula latex="2A" /> — fully constructive.{' '}
              <MathFormula latex="\Delta\varphi=180°" /> (out of step) gives amplitude{' '}
              <MathFormula latex="0" /> — fully destructive. Anything in between is a partial
              combination.
            </p>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Worked example
              </p>
              <p className="text-xs">
                Two identical waves of amplitude <MathFormula latex="A = 2" /> cm arrive with{' '}
                <MathFormula latex="\Delta\varphi = 60°" />.
              </p>
              <p className="font-mono text-xs text-deepteal">New amplitude = 2(2) · cos(30°)</p>
              <p className="font-mono text-xs text-deepteal font-bold">≈ 4 · 0.866 ≈ 3.46 cm</p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For exactly two identical waves of
                the same frequency, meeting at a single point, we have an exact formula for the
                result. Scientists use simulation when simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card
            id="wi-part-4"
            eyebrow="Part 4"
            title="Different phase differences"
            icon={<Speaker className="w-5 h-5 text-gold-hover" />}
          >
            <p>The equations remain the same. Only the value of Δφ changes.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[300px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Phase difference Δφ</th>
                    <th className="text-left py-2 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {PHASE_TABLE.map((row) => (
                    <tr key={row.phi} className="border-b border-sage/30">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.phi}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                'Which phase difference produces total silence, if these were sound waves?',
                'What happens if the two sources have slightly different frequencies instead of a fixed phase difference?',
                'Why might headphones with "noise cancelling" rely on this exact idea?',
              ]}
            />
            <p className="text-xs italic">
              Don't calculate yet. Predict first — then use the simulator below to check yourself.
            </p>
          </Card>

          <WaveInterferenceSimulator />

          <Card
            id="wi-part-5"
            eyebrow="Part 5"
            title="Why equations eventually fail"
            icon={<Cpu className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              So far, we have assumed exactly two sources, identical amplitude and frequency, a
              single point in space, no obstacles or reflections, and a fixed, unmoving phase
              difference. Real wave environments are usually far messier.
            </p>

            <p className="font-semibold text-deepteal pt-1">Many sources at many points</p>
            <p>
              Ripple tanks, speaker arrays, and antenna networks often have many sources, and we
              usually want the pattern across an entire surface — not just one point. Adding N
              waves together, at every point on a grid, gets complicated fast.
            </p>

            <p className="font-semibold text-deepteal pt-1">Reflections and obstacles</p>
            <p>
              Real ponds have walls. Real rooms have furniture. Waves bounce off these surfaces and
              interfere with the original waves, and with each other's reflections.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Why simulation helps
              </p>
              <p className="text-xs">
                Once many sources, reflecting boundaries, and an entire 2D surface are all involved
                at once, no single formula captures the whole pattern: each source's wave spreads
                outward, waves reflect off boundaries and spread again, every point on the surface
                adds up contributions from every source and every reflection, and the pattern keeps
                evolving as time advances. A simulation handles this naturally by updating the wave
                field in many small time steps, across a whole grid of points.
              </p>
            </div>
          </Card>

          <Card
            id="wi-part-6"
            eyebrow="Part 6"
            title="How a simulation thinks"
            icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}
          >
            <p>
              Instead of solving everything at once, the computer repeatedly performs, at every
              point on a grid — the same computation the Python lab below runs every time you hit
              &ldquo;Run&rdquo;:
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
              The shifting, swirling interference pattern emerges naturally from these small steps.
            </p>
          </Card>

          <Card
            id="wi-part-7"
            eyebrow="Part 7"
            title="Real-world applications"
            icon={<Waves className="w-5 h-5 text-gold-hover" />}
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

export const WaveInterferenceLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
      Key takeaway
    </p>
    <p className="text-sm text-sage-light leading-relaxed">
      Two identical waves meeting at a single point can be combined with one exact formula — the
      result depends cleanly on their phase difference.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula
        latex={String.raw`y_{total}(t) = 2A\cos\!\left(\frac{\Delta\varphi}{2}\right)\sin\!\left(2\pi ft + \frac{\Delta\varphi}{2}\right)`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Many sources, reflecting boundaries, and a whole surface of points to track quickly becomes
      too complex to solve analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
