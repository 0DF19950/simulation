import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { AcceleratorLesson, AcceleratorLessonClosing } from './AcceleratorLesson';
import { AcceleratorPythonLab } from './AcceleratorPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const ACCELERATOR_CHALLENGES: Challenge[] = [
  { label: 'One particle, uniform field', hint: 'Run the default and check the measured radius against r = mv/(qB) — in the simulator or the lab below.' },
  { label: 'A second particle, same charge', hint: 'Add a second dot 6 mm away. With WEIGHT = 1 nothing visible happens; set it to 25e6 and watch how the repulsion actually shows up.' },
  { label: 'A full bunch', hint: 'Switch the simulator to a bunch with space charge on, or add a cloud of dots to PARTICLES, and watch its size over many laps.' },
  { label: 'A radio-frequency cavity', hint: 'Turn on the RF cavity in the simulator. Predict first: what happens to the radius, and to the time per lap?' },
  { label: 'Energy loss from radiation', hint: 'Turn on radiation loss and watch the radius shrink. Note how much the loss had to be exaggerated to be visible at all.' },
];

export const AcceleratorPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="particle-accelerator" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <AcceleratorLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">Push the particles yourself</h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">You write the physics; the lab does the pushing.</p>
          </div>

          <AcceleratorPythonLab />

          <SimulationChallenges
            challenges={ACCELERATOR_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one — then check it in the simulator above or by editing PARTICLES and electric_field(x, y, others)."
          />

          <AcceleratorLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 8, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
