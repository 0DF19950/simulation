import React from 'react';
import { Antenna, Cpu, Gauge, RefreshCw, Ruler, Shapes, Sigma, Zap } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { Card, Eq, Predict, SymbolTable } from './LessonPrimitives';
import { PreLessonQuiz, QuizQuestion } from './PreLessonQuiz';
import { ElectricFieldSimulator } from './ElectricFieldSimulator';
import { ElectricFieldInstrumentWidget } from './ElectricFieldInstrumentWidget';

const FIELD_QUESTIONS: QuizQuestion[] = [
  {
    id: 'ef1',
    prompt:
      'Two identical positive charges sit near each other. Directly between them, at the midpoint, what happens to the field pointing along the line joining them?',
    options: [
      { id: 'a', text: 'It cancels out completely' },
      { id: 'b', text: 'It combines into a stronger field' },
      { id: 'c', text: 'It stays the same as one charge alone' },
      { id: 'd', text: 'It reverses direction' },
    ],
    correctId: 'a',
    explanation:
      'At the midpoint each field has the same size and points away from its own charge — so the two point in exactly opposite directions and cancel. It is the L → 0 row of Part 4.',
  },
  {
    id: 'ef2',
    prompt: 'One positive and one identical negative charge sit near each other. At the midpoint between them, what happens?',
    options: [
      { id: 'a', text: 'The field cancels out' },
      { id: 'b', text: 'The field adds up and gets stronger' },
      { id: 'c', text: 'Nothing changes' },
    ],
    correctId: 'b',
    explanation:
      'One field points away from the positive charge and the other points toward the negative one — the same direction. They add: the midpoint field is 8kQ/d², twice what either charge makes alone.',
  },
  {
    id: 'ef3',
    prompt: 'If you add a third charge to a two-charge field pattern, the resulting pattern is:',
    options: [
      { id: 'a', text: 'Just the old pattern, unchanged' },
      { id: 'b', text: 'Twice as simple' },
      { id: 'c', text: 'Noticeably more complex' },
    ],
    correctId: 'c',
    explanation:
      'Superposition still applies — add the third field vector in — but the regions where fields reinforce and cancel rearrange into a noticeably more intricate pattern. That is exactly why simulation becomes useful past two charges.',
  },
];

const CONTENTS = [
  { id: 'ef-part-1', label: 'Describing an electric field' },
  { id: 'ef-part-2', label: 'The principle of superposition' },
  { id: 'ef-part-3', label: 'Building the mathematical model' },
  { id: 'ef-part-4', label: 'Different geometries' },
  { id: 'ef-part-5', label: 'Why equations eventually fail' },
  { id: 'ef-part-6', label: 'How a simulation thinks' },
  { id: 'ef-part-7', label: 'Real-world applications' },
];

const GOALS = [
  'Describe an electric field using charge, distance, and field strength.',
  'Add fields by superposition — as vectors, where direction matters as much as size.',
  'Derive the exact field on the bisector of two identical charges.',
  'Predict where two charges reinforce each other and where they cancel.',
  'Recognize why many sources, conductors, and a whole region push past what one formula can capture.',
  'Build the superposition function a real field simulation evaluates at every grid point.',
];

const GEOMETRY_TABLE = [
  { geometry: 'L much greater than d (far away)', result: 'Field behaves like one source of charge 2Q' },
  {
    geometry: 'L = d/2',
    result:
      'Partial combination — each charge’s field arrives at 45°, keeping cos 45° ≈ 0.71 of its strength along the bisector, for a total of about 1.41 × one charge’s field at that radius',
  },
  { geometry: 'L → 0 (right at the midpoint)', result: 'Outward field along the bisector shrinks to zero' },
  { geometry: 'Negative pair instead of positive pair', result: 'Same geometry, field direction reverses' },
];

const ASSUMPTIONS = [
  'Exactly two charges',
  'Identical magnitude',
  'A single point in space',
  'No conductors or boundaries nearby',
  'A fixed, unmoving arrangement',
];

const APPLICATIONS = [
  'Circuit board and chip design',
  'Antenna and radar engineering',
  'MRI magnet and coil design',
  'Faraday cage and shielding design',
  'Plasma and space-weather modeling',
];

const SIM_STEPS = [
  { code: 'Eᵢ = k·qᵢ·r̂ / r²', label: 'Calculate the contribution from each charge source' },
  { code: 'Eᵢ for each induced charge', label: 'Add contributions from any induced or reflected charge on nearby conductors' },
  { code: 'E_total = Σ Eᵢ', label: 'Sum everything together (superposition) to get the total field' },
  { code: 't += Δt, if sources move', label: 'Advance time by a small step, if sources are moving or changing' },
  { code: 'repeat, for every point on the grid', label: 'Repeat for every point on the grid, every step' },
];

export const ElectricFieldLesson: React.FC = () => (
  <section className="py-12 bg-cream border-b border-sage/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Lesson header */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold">
          <Zap className="w-4 h-4 text-gold-hover" />
          <span>Lesson 7 · High School</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
          Electromagnetic fields — when do we need simulation?
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine rubbing two balloons on your hair and holding them near each other, a short
                distance apart. Each balloon carries its own electric field, pushing and pulling on
                any charge nearby. Where the two fields overlap, something interesting happens: in
                some spots the field adds up and gets stronger, in others it weakens or nearly
                disappears. Simple enough to picture — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>Why does the field get stronger in some places and weaker in others?</li>
                <li>Can you predict exactly where the field cancels out before measuring it?</li>
                <li>What if you had three charges instead of two?</li>
                <li>What if the charges weren't equal in strength?</li>
                <li>What if a conducting surface nearby reflected the field back on itself?</li>
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
            <ElectricFieldInstrumentWidget />
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
            questions={FIELD_QUESTIONS}
            title="Without calculating anything, answer the following"
            intro="Keep your answers — we return to them later."
            singleColumn
          />

          <Card id="ef-part-1" eyebrow="Part 1" title="Describing an electric field" icon={<Ruler className="w-5 h-5 text-gold-hover" />}>
            <p>
              Every point charge in this lesson creates a field that spreads outward in all
              directions and weakens with distance. Two quantities describe the source; a third
              describes the effect it has at a point in space.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Charge</p>
                <p className="text-xs">
                  How strong the source is, and whether it pushes or pulls. Written{' '}
                  <MathFormula latex="Q" />, units coulombs (C).
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Distance</p>
                <p className="text-xs">
                  How far the point of interest is from the charge. Written <MathFormula latex="r" />, units m.
                </p>
              </div>
              <div className="bg-cream border border-sage/60 rounded-lg p-3.5">
                <p className="font-semibold text-deepteal text-sm mb-1">Field strength</p>
                <p className="text-xs">
                  How hard the source pushes or pulls on a unit of charge placed there. Written{' '}
                  <MathFormula latex="E" />, units N/C — and it is a vector, with both a size and a
                  direction.
                </p>
              </div>
            </div>
            <p className="text-xs">A single point charge produces a field at distance r given by Coulomb's law:</p>
            <Eq latex={String.raw`E(r) = k\,\frac{Q}{r^2}`} />
            <p className="text-xs italic">
              where <MathFormula latex="k" /> is Coulomb's constant, and the field points away from a
              positive charge — or toward a negative one.
            </p>
          </Card>

          <Card id="ef-part-2" eyebrow="Part 2" title="The principle of superposition" icon={<Sigma className="w-5 h-5 text-gold-hover" />}>
            <p>
              When two or more charges create fields that overlap at the same point in space, physics
              gives us the same remarkably simple rule we saw with waves: just add the field vectors
              together.
            </p>
            <Eq latex={String.raw`\vec{E}_{total} = \vec{E}_1 + \vec{E}_2`} />
            <p className="font-semibold text-deepteal">
              That's it — no complicated interaction, no fields &ldquo;colliding.&rdquo; Each charge
              keeps producing its own field as if the other weren't there; you just add up the
              vectors at each point.
            </p>
            <p className="text-xs">
              The one difference from waves is that field addition is a <strong className="text-deepteal">vector sum</strong>,
              so direction matters as much as size. This single rule is what causes both the strong
              regions and the calm spots around a pair of charges.
            </p>
          </Card>

          <Card id="ef-part-3" eyebrow="Part 3" title="Building the mathematical model" icon={<Gauge className="w-5 h-5 text-gold-hover" />}>
            <p className="font-semibold text-deepteal">Step 1 — Two identical charges</p>
            <p className="text-xs">
              Suppose two identical positive charges <MathFormula latex="+Q" /> sit a distance{' '}
              <MathFormula latex="d" /> apart, and we want the field at a point <MathFormula latex="P" />{' '}
              on the perpendicular bisector of the line joining them — a distance{' '}
              <MathFormula latex="L" /> from the midpoint, straight out to the side. Each charge is
              the same distance from P, and each produces a field of the same size, aimed directly
              away from its own charge:
            </p>
            <Eq latex={String.raw`r = \sqrt{L^2 + (d/2)^2} \qquad E = \frac{kQ}{r^2}`} />

            <p className="font-semibold text-deepteal pt-2">Step 2 — Combine them</p>
            <p className="text-xs">
              By symmetry, the components of the two field vectors that point along the line joining
              the charges cancel exactly. The components pointing outward along the bisector add
              together. This gives an exact, closed-form result:
            </p>
            <Eq latex={String.raw`E_{total} = \frac{2kQL}{\left(L^2 + (d/2)^2\right)^{3/2}}`} />
            <SymbolTable
              rows={[
                { symbol: 'Q', meaning: 'Charge of each individual source' },
                { symbol: 'd', meaning: 'Separation between the two charges' },
                { symbol: 'L', meaning: 'Distance from the midpoint to point P, along the bisector' },
                { symbol: 'E_{total}', meaning: 'Combined field strength at point P' },
              ]}
            />

            <p className="font-semibold text-deepteal pt-2">Step 3 — Near and far behavior</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex gap-2">
                <span className="text-gold-hover shrink-0">·</span>
                <span>
                  <strong className="text-deepteal">Very far away</strong> (<MathFormula latex="L \gg d" />): the
                  two charges act almost like a single charge of <MathFormula latex="2Q" /> — the field
                  falls off as <MathFormula latex="1/L^2" />, just like one source.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-hover shrink-0">·</span>
                <span>
                  <strong className="text-deepteal">Very close to the midpoint</strong> (<MathFormula latex="L \ll d" />):
                  the outward components nearly cancel, and the field along the bisector shrinks
                  toward zero.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-hover shrink-0">·</span>
                <span>
                  <strong className="text-deepteal">In between</strong>: a smooth, predictable
                  combination governed by the exact formula above.
                </span>
              </li>
            </ul>

            <div className="bg-cream border border-sage/60 rounded-lg p-3.5 space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Worked example
              </p>
              <p className="text-xs">
                Two identical charges of <MathFormula latex={String.raw`Q = 2 \times 10^{-6}`} /> C (2
                microcoulombs) sit <MathFormula latex="d = 4" /> cm apart. What is the field at a point
                on the bisector, <MathFormula latex="L = 3" /> cm from the midpoint?
              </p>
              <p className="font-mono text-xs text-deepteal">r² = L² + (d/2)² = 3² + 2² = 13 cm², so r ≈ 3.61 cm</p>
              <p className="font-mono text-xs text-deepteal">
                E_total = 2kQL / r³ ≈ 2 × (8.99 × 10⁹) × (2 × 10⁻⁶) × (0.03) / (0.0361)³
              </p>
              {/* The source PDF prints 2.29 × 10⁶ here; its own arithmetic gives 10⁷. */}
              <p className="font-mono text-xs text-deepteal font-bold">
                ≈ 2.29 × 10⁷ N/C, directed straight out along the bisector, away from the charges
              </p>
              <p className="text-xs italic">
                With the unrounded r = 3.606 cm it is 2.30 × 10⁷ N/C — the value the simulator's probe
                reports at these settings.
              </p>
            </div>

            <div className="bg-cream border-l-2 border-gold rounded-r-lg p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold-hover mb-1.5">
                Do we need simulation yet?
              </p>
              <p className="text-xs">
                <strong className="text-deepteal">No.</strong> For exactly two identical point charges,
                evaluated at a single point in space, we have an exact formula for the result.
                Scientists use simulation when simpler mathematical methods stop working.
              </p>
            </div>
          </Card>

          <Card id="ef-part-4" eyebrow="Part 4" title="Different geometries" icon={<Shapes className="w-5 h-5 text-gold-hover" />}>
            <p>The equations remain the same. Only the values of L and d change.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-sage text-deepteal font-mono uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Geometry</th>
                    <th className="text-left py-2 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {GEOMETRY_TABLE.map((row) => (
                    <tr key={row.geometry} className="border-b border-sage/30 align-top">
                      <td className="py-2 pr-4 font-mono text-deepteal font-bold">{row.geometry}</td>
                      <td className="py-2 text-deepteal-soft font-sans">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Predict
              items={[
                'Which arrangement makes the field at the midpoint exactly zero, if the two charges were opposite in sign instead of identical?',
                'What happens to the pattern if the two charges have slightly different strengths instead of being identical?',
                'Why might a Faraday cage — a hollow conductor — rely on this same cancellation idea to shield the space inside?',
              ]}
            />
            <p className="text-xs italic">
              Think before revealing the answer — then use the simulator below to check yourself.
            </p>
          </Card>

          <ElectricFieldSimulator />

          <Card id="ef-part-5" eyebrow="Part 5" title="Why equations eventually fail" icon={<Cpu className="w-5 h-5 text-gold-hover" />}>
            <p>So far, we have assumed:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ASSUMPTIONS.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-gold-hover shrink-0">·</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p>Real electromagnetic environments are usually far messier.</p>

            <p className="font-semibold text-deepteal pt-1">Many sources at many points</p>
            <p>
              Circuit boards, antenna arrays, and charged dust clouds often have many sources, and we
              usually want the field across an entire region — not just one point. Adding N field
              vectors together, at every point on a grid, gets complicated fast.
            </p>

            <p className="font-semibold text-deepteal pt-1">Conductors and boundaries</p>
            <p>
              Real circuits have grounded metal cases. Real rooms have wiring in the walls. Conductors
              redistribute their own charge in response to nearby fields, and that redistributed charge
              creates new fields that interfere with the original ones.
            </p>

            <div className="bg-cream p-3.5 rounded-lg border border-sage/60 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Why simulation helps
              </p>
              <p className="text-xs">
                Once many sources, responsive conductors, and an entire 2D or 3D region are all involved
                at once, no single formula captures the whole pattern:
              </p>
              <ul className="space-y-0.5 text-xs">
                {[
                  "Each source's field spreads outward.",
                  'Conductors respond by redistributing charge, which spreads new fields again.',
                  'Every point in space adds up contributions from every source and every induced charge.',
                  'The pattern keeps evolving as sources move or change.',
                ].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold-hover shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs">
                This feedback loop across an entire region quickly becomes difficult to solve
                analytically. A simulation handles it naturally by updating the field at many grid
                points, in many small steps.
              </p>
            </div>
          </Card>

          <Card id="ef-part-6" eyebrow="Part 6" title="How a simulation thinks" icon={<RefreshCw className="w-5 h-5 text-gold-hover" />}>
            <p>
              Instead of solving everything at once, the computer repeatedly performs, at every point
              on a grid — the same computation the Python lab below runs every time you hit
              &ldquo;Run&rdquo;:
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
              The shifting, swirling field pattern emerges naturally from these small steps.
            </p>
          </Card>

          <Card id="ef-part-7" eyebrow="Part 7" title="Real-world applications" icon={<Antenna className="w-5 h-5 text-gold-hover" />}>
            <p className="text-xs">Electromagnetic field simulations are used in:</p>
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

export const ElectricFieldLessonClosing: React.FC = () => (
  <div className="bg-deepteal border border-deepteal-dark rounded-xl p-5 sm:p-6 space-y-3">
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">Key takeaway</p>
    <p className="text-sm text-sage-light leading-relaxed">
      Two identical charges evaluated at a single point can be combined with one exact formula — the
      result depends cleanly on the geometry.
    </p>
    <div className="bg-deepteal-dark/60 border border-gold/30 rounded-lg p-4 text-center">
      <MathFormula
        latex={String.raw`E_{total} = \frac{2kQL}{\left(L^2 + (d/2)^2\right)^{3/2}}`}
        block
        className="text-cream"
      />
    </div>
    <p className="text-sm text-sage-light leading-relaxed">
      Many sources, responsive conductors, and a whole region of points to track quickly becomes too
      complex to solve analytically.
    </p>
    <p className="text-sm text-sage-light leading-relaxed font-semibold">
      That is where simulation becomes one of the most powerful tools in science.
    </p>
  </div>
);
