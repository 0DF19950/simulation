import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';
import { SimulationParams } from '../types';
import { useFallingLab } from '../hooks/useFallingLab';
import { exportTrajectoryToCSV } from '../utils/simulationEngine';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { LessonTierNav } from './LessonTierNav';
import { FallingLessonUG, FallingLessonUGClosing } from './FallingLessonUG';
import { PythonLabEditor } from './PythonLabEditor';
import { PygameCanvasVisualizer } from './PygameCanvasVisualizer';
import { InteractivePlots } from './InteractivePlots';
import { SimulationChallenges, Challenge } from './SimulationChallenges';

// Undergraduate defaults: drag switched on and RK4 selected, so the lab opens
// on the regime this lesson is actually about.
const UG_DEFAULTS: SimulationParams = {
  gravity: 9.81,
  initialHeight: 50.0,
  initialVelocity: 0.0,
  dragCoefficient: 0.05,
  mass: 1.0,
  dt: 0.02,
  method: 'rk4',
};

const UG_CHALLENGES: Challenge[] = [
  {
    label: 'Numerical convergence',
    hint: 'Simulate the 50 m vacuum drop at several Δt. Compare the numerical impact time with the analytical prediction and determine how the error changes as Δt decreases.',
  },
  {
    label: 'Euler vs. RK4',
    hint: 'Run exactly the same physical model under both. Keep every physical parameter identical and change only the algorithm — then compare trajectory, impact time, error, and cost.',
  },
  {
    label: 'Reach terminal velocity',
    hint: 'Choose m, Cd, A, ρ and calculate v_t = √(2mg / ρCdA). Run the simulation. Does the simulated velocity approach the predicted value, and how close does it get?',
  },
  {
    label: 'Mass vs. drag',
    hint: 'Two objects, identical Cd and A, different masses, released from the same height. Predict which lands first, then explain the result using Newton’s second law.',
  },
  {
    label: 'Change the atmosphere',
    hint: 'Keep the object unchanged and vary ρ. Try ρ, ρ/2, and 2ρ. Use v_t ∝ 1/√ρ to predict the trend before you run it.',
  },
  {
    label: 'Drop from high altitude',
    hint: 'Replace constant gravity with g(h) = GM/(R_E+h)² and constant density with ρ(h) = ρ₀e^(−h/H). At what initial altitude do the differences become noticeable? The answer depends on the accuracy you require.',
  },
  {
    label: 'Break the simulation',
    hint: 'Increase Δt until the result becomes visibly inaccurate or unstable, record the behaviour, then reduce it until stable again. The goal is not a correct answer — it is understanding how a method produces a wrong one.',
  },
];

export const FallingUGPage: React.FC = () => {
  const lab = useFallingLab(UG_DEFAULTS);
  const labSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="falling" active="undergrad" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <FallingLessonUG />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Solve the coupled system yourself
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              Opens with quadratic drag and RK4 — change the method and watch the error move.
            </p>
          </div>

          <PythonLabEditor
            activeDomain="classical"
            activeTier="undergrad"
            params={lab.params}
            setParams={lab.setParams}
            onRunSimulation={lab.runSimulation}
            onResetParams={lab.resetParams}
            isPyodideReady={lab.isPyodideReady}
            isExecuting={lab.isExecuting}
            errorMessage={lab.errorMessage}
            onExportCSV={() => exportTrajectoryToCSV(lab.points)}
            initialCodeOverride={lab.codeOverride}
          />

          <SimulationChallenges
            challenges={UG_CHALLENGES}
            title="Simulation challenges"
            intro="Each one changes a single thing and asks what it did to the answer. Predict first, then edit the acceleration function above and check yourself."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PygameCanvasVisualizer
              domain="classical"
              params={lab.params}
              points={lab.points}
              currentStepIndex={lab.currentStepIndex}
              setCurrentStepIndex={lab.setCurrentStepIndex}
              isPlaying={lab.isPlaying}
              setIsPlaying={lab.setIsPlaying}
              onReset={() => lab.setCurrentStepIndex(0)}
            />
            <InteractivePlots points={lab.points} />
          </div>

          <FallingLessonUGClosing />
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 1, undergraduate</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
};
