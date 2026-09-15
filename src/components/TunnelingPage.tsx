import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { TunnelingLesson, TunnelingLessonClosing } from './TunnelingLesson';
import { TunnelingPythonLab } from './TunnelingPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const TUNNELING_CHALLENGES: Challenge[] = [
  {
    label: 'One barrier vs. the formula',
    hint: 'Send a wave packet at a single barrier and compare the share that gets through with the exact formula — in the simulator or the lab below.',
  },
  {
    label: 'A second barrier',
    hint: 'Add a second barrier and scan the energy. Predict what happens where the wave bouncing between them lines up with itself.',
  },
  {
    label: 'A shaking barrier',
    hint: 'Make the barrier height oscillate in time. Does the packet get through more often or less, and does the period matter?',
  },
  {
    label: 'Thinner and thicker',
    hint: 'Shrink and widen the barrier in small steps. Check that every extra tenth of a nanometre multiplies the chance by about the same factor.',
  },
  {
    label: 'Two electrons at once',
    hint: 'Send two electrons that repel each other at the same barrier. Predict whether the front one or the back one gets through more.',
  },
];

export const TunnelingPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="quantum-tunneling" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <TunnelingLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">A wave on a grid</h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">Curvature at every point, every step — and some of the wave gets through.</p>
          </div>

          <TunnelingPythonLab />

          <SimulationChallenges
            challenges={TUNNELING_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one — then check it in the simulator above or by editing the code in the lab."
          />

          <TunnelingLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 11, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
