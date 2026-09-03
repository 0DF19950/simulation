import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { RocketLesson, RocketLessonClosing } from './RocketLesson';
import { RocketPythonLab } from './RocketPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const ROCKET_CHALLENGES: Challenge[] = [
  { label: 'Straight-up launch', hint: 'No gravity turn. Predict the burnout speed before you run it — Part 3 gives you the closed form to check against.' },
  { label: 'Add a gravity turn', hint: 'Tip the rocket partway through the burn. Watch the trajectory become a two-direction problem, like Lesson 2.' },
  { label: 'Double the fuel mass', hint: "Increase the mass ratio without changing the engine. Does Δv double too? Check against Part 3's formula." },
  { label: 'Add a second stage', hint: 'In the code below, drop the burnt-out first stage mass partway through and keep burning with a fresh burn rate.' },
  { label: 'Launch from Mars', hint: 'Set g = 3.71 in the code below. Same rocket, same fuel — how much farther does it get?' },
];

export const RocketPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="rocket" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <RocketLesson />

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
              Now with mass in the denominator — the loop from Part 6, running for real.
            </p>
          </div>

          <RocketPythonLab />

          <SimulationChallenges
            challenges={ROCKET_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one, then edit acceleration(t, m, vx, vy) above to check yourself."
          />

          <RocketLessonClosing />
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
