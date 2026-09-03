import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { DoublePendulumLesson, DoublePendulumLessonClosing } from './DoublePendulumLesson';
import { DoublePendulumPythonLab } from './DoublePendulumPythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const PENDULUM_CHALLENGES: Challenge[] = [
  { label: 'Small-angle release', hint: 'Release from a small angle and watch it behave almost like a single pendulum.' },
  { label: 'Large-angle release', hint: 'Release from a large angle and watch chaotic tumbling begin.' },
  { label: 'Compare nearby starts', hint: 'Use the simulator above with starting angles 0.001° apart and compare the paths after 10 seconds.' },
  { label: 'Lighten the lower arm', hint: 'In the code below, make m2 much smaller than m1. Does the motion look different?' },
  { label: 'Mismatch the lengths', hint: 'Make L1 and L2 very different in the code below. Predict the shape of the motion first.' },
];

export const DoublePendulumPage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="double-pendulum" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <DoublePendulumLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Write the physics yourself
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              Two angles in, two angular accelerations out — coupled, this time.
            </p>
          </div>

          <DoublePendulumPythonLab />

          <SimulationChallenges
            challenges={PENDULUM_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one, then edit angular_acceleration(theta1, theta2, omega1, omega2) above to check yourself."
          />

          <DoublePendulumLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 5, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
