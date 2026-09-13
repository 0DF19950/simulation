import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { ElectricFieldLesson, ElectricFieldLessonClosing } from './ElectricFieldLesson';
import { ElectricFieldPythonLab } from './ElectricFieldPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const FIELD_CHALLENGES: Challenge[] = [
  { label: 'Two identical charges', hint: 'Simulate them and watch the field pattern form. Part 3 gives you the exact value to check at P.' },
  { label: 'Flip one charge negative', hint: 'Watch the cancellation region shift — and see what happens at the midpoint.' },
  { label: 'Add a third charge', hint: 'Append a third entry to CHARGES. The pattern gets noticeably more intricate.' },
  { label: 'Add a grounded conducting plate', hint: 'For each charge, add a mirror image across the plate with the opposite sign, and watch the field meet the plate at right angles.' },
  { label: 'Slightly different strengths', hint: 'Give the two charges different values of q. Predict where the calm spot moves before running it.' },
];

export const ElectricFieldPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="electromagnetic-fields" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <ElectricFieldLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Add the field vectors yourself
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              A list of charges in, a whole region of field out.
            </p>
          </div>

          <ElectricFieldPythonLab />

          <SimulationChallenges
            challenges={FIELD_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one, then edit CHARGES and total_field(x, y, charges) above to check yourself."
          />

          <ElectricFieldLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 7, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
