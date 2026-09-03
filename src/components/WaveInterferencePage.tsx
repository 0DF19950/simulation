import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { WaveInterferenceLesson, WaveInterferenceLessonClosing } from './WaveInterferenceLesson';
import { WaveInterferencePythonLab } from './WaveInterferencePythonLab';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

const WAVE_CHALLENGES: Challenge[] = [
  { label: 'Two sources in step', hint: 'Δφ = 0. Predict the pattern before you run it — Part 3 gives you the exact formula to check the center against.' },
  { label: 'Shift one source out of phase', hint: 'Watch calm spots appear as Δφ moves toward 180°.' },
  { label: 'Add a third source', hint: 'In the code below, append a third entry to SOURCES. The pattern gets noticeably more intricate.' },
  { label: 'Add a reflecting wall', hint: 'Add a mirror-image source — same position reflected across a wall line, phase shifted by π — and watch it interfere with the originals.' },
  { label: 'Slightly different frequencies', hint: 'Give the two sources frequencies that differ by 10-15%. Predict what happens to the pattern over time before running it.' },
];

export const WaveInterferencePage: React.FC = () => {
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="wave-interference" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <WaveInterferenceLesson />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Write the superposition yourself
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              A list of sources in, a whole field of interference out.
            </p>
          </div>

          <WaveInterferencePythonLab />

          <SimulationChallenges
            challenges={WAVE_CHALLENGES}
            title="Simulation challenges"
            intro="Predict the outcome before running each one, then edit SOURCES and total_displacement(x, y, t, sources) above to check yourself."
          />

          <WaveInterferenceLessonClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 6, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
