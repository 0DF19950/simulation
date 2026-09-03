import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { ProjectileLesson, ProjectileLessonClosing } from './ProjectileLesson';
import { ProjectilePythonLab } from './ProjectilePythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const PROJECTILE_CHALLENGES: Challenge[] = [
  { label: 'Launch angle of 45°', hint: 'No air resistance. Predict the range before you run it — Part 3 gives you the exact formula to check against.' },
  { label: 'Double the launch speed', hint: 'What happens to the range? Hint: the closed-form formula says it should scale in a very specific way.' },
  { label: 'Add air resistance', hint: 'Set drag above 0 in the code. Watch the arc lose its symmetry — the ball comes down steeper than it went up.' },
  { label: 'Throw it on the Moon', hint: 'Set g = 1.62 in the code below. Same launch, wildly different range.' },
  { label: 'Add a steady sideways wind', hint: 'With drag already on, add a wind term to the acceleration function. Predict the outcome before running it.' },
];

export const ProjectilePage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="projectile" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <ProjectileLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Write the acceleration yourself
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              Two components in, two components out — the vector version of Lesson 1's lab.
            </p>
          </div>

          <ProjectilePythonLab />

          <SimulationChallenges
            challenges={PROJECTILE_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one, then edit acceleration(x, y, vx, vy) above to check yourself."
          />

          <ProjectileLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 2, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
