import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { OrbitalLesson, OrbitalLessonClosing } from './OrbitalLesson';
import { OrbitalPythonLab } from './OrbitalPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const ORBIT_CHALLENGES: Challenge[] = [
  {
    label: 'Circular orbit',
    hint: 'Create a satellite that stays in a circular orbit. Predict the trajectory before you run it.',
  },
  { label: 'Lower velocity', hint: 'Reduce the initial velocity. What happens?' },
  { label: 'Higher velocity', hint: 'Increase the initial velocity. What changes?' },
  {
    label: 'Zero gravity',
    hint: 'Set G = 0. What trajectory do you expect before you look?',
  },
  {
    label: 'Two bodies',
    hint: "Add the Moon's gravitational influence. Does the orbit remain perfectly circular?",
  },
  {
    label: 'Perturbation',
    hint: 'Give the satellite a small change in velocity. Does it return to the original orbit, or settle into a new one?',
  },
];

export const OrbitalPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="orbit" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <OrbitalLesson />

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

          <OrbitalPythonLab />

          <SimulationChallenges
            challenges={ORBIT_CHALLENGES}
            title="Simulation challenges"
            intro="Predict each outcome before running it. The simulator's presets cover the first four; the last two are yours to set up."
          />

          <OrbitalLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 3, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
