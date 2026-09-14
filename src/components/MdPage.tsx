import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { MdLesson, MdLessonClosing } from './MdLesson';
import { MdPythonLab } from './MdPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const MD_CHALLENGES: Challenge[] = [
  {
    label: 'Two atoms, bound',
    hint: 'Start two atoms at rest a little beyond r_min. Predict the turning points from U(r) = E, then watch the pair settle into its oscillation — in the simulator or the lab below.',
  },
  {
    label: 'Add a third atom',
    hint: 'Fire a third atom at a vibrating pair, and compare the run with a twin nudged by a millionth of a nanometre. How long do the two agree?',
  },
  { label: 'A small cluster', hint: 'Build a cluster of 7 or 19 atoms. Before each run, predict whether it will hold together or fly apart.' },
  {
    label: 'Melt a solid',
    hint: 'Raise the starting temperature one step at a time and watch the bonds-intact line. Where does the solid-like cluster start to melt?',
  },
  {
    label: 'A liquid surface, or a gas',
    hint: 'With 100 atoms, find a starting temperature that leaves a liquid drop with a clear surface, and one where a gas spreads to fill the box.',
  },
];

export const MdPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="molecular-dynamics" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <MdLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">Push, pull, step, repeat</h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">Every pair of atoms, every step — and matter emerges.</p>
          </div>

          <MdPythonLab />

          <SimulationChallenges
            challenges={MD_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one — then check it in the simulator above or by editing the code in the lab."
          />

          <MdLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 10, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
