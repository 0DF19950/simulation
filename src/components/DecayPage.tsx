import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { DecayLesson, DecayLessonClosing } from './DecayLesson';
import { DecayPythonLab } from './DecayPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const DECAY_CHALLENGES: Challenge[] = [
  { label: 'A single isotope vs. the formula', hint: 'Run one isotope and compare the simulated count with N₀e^(−λt) — in the simulator or the lab below.' },
  { label: 'A radioactive daughter', hint: 'Make the daughter radioactive too, forming a two-step chain. Predict when it peaks before you run it.' },
  { label: 'Three or more steps', hint: 'Extend the chain. Each member gains from the one before it and loses to the one after.' },
  { label: 'A few dozen atoms', hint: 'Shrink the sample and run it several times with new random numbers. Watch how far each run strays from the curve.' },
  { label: 'Two isotopes mixed', hint: 'Mix two isotopes with different half-lives and watch their curves add — does the total still have one half-life?' },
];

export const DecayPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="radioactive-decay" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <DecayLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">Roll the dice for every atom</h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">One random number per atom, per step — and a curve emerges.</p>
          </div>

          <DecayPythonLab />

          <SimulationChallenges
            challenges={DECAY_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one — then check it in the simulator above or by editing the code in the lab."
          />

          <DecayLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 9, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
