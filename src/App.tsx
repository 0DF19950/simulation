import React, { useEffect, useRef, useState } from 'react';
import { SimulationParams } from './types';
import { FallingBallLesson } from './components/FallingBallLesson';
import { PygameCanvasVisualizer } from './components/PygameCanvasVisualizer';
import { PythonLabEditor } from './components/PythonLabEditor';
import { InteractivePlots } from './components/InteractivePlots';
import { SimulationChallenges } from './components/SimulationChallenges';
import { PhilomathLabLogo } from './components/PhilomathLabLogo';
import { LessonTierNav } from './components/LessonTierNav';
import { LandingPage } from './components/LandingPage';
import { FallingUGPage } from './components/FallingUGPage';
import { ProjectilePage } from './components/ProjectilePage';
import { OrbitalPage } from './components/OrbitalPage';
import { useFallingLab } from './hooks/useFallingLab';
import { exportTrajectoryToCSV } from './utils/simulationEngine';
import { Terminal } from 'lucide-react';

const HS_DEFAULTS: SimulationParams = {
  gravity: 9.81,
  initialHeight: 50.0,
  initialVelocity: 0.0,
  dragCoefficient: 0.0,
  mass: 1.0,
  dt: 0.02,
  method: 'euler',
};

function FallingLessonView() {
  const lab = useFallingLab(HS_DEFAULTS);
  const labSectionRef = useRef<HTMLDivElement>(null);

  // From Lesson 1's planet picker: "Load this g into the lab"
  const handleLoadPlanetIntoLab = (g: number, planetName: string) => {
    lab.setParams((prev) => ({ ...prev, gravity: g }));
    const code = `# Loaded from lesson: Free fall on ${planetName}
def acceleration(y, v):
    g = ${g.toFixed(2)}        # Gravity on ${planetName} (m/s^2)
    drag = ${lab.params.dragCoefficient.toFixed(2)}     # Air drag coefficient
    return -g - drag * v * abs(v)`;
    lab.setCodeOverride(code);

    setTimeout(() => {
      labSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      {/* Minimal header — just the brand, no multi-domain nav */}
      <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#/" className="shrink-0" aria-label="Back to topics">
            <PhilomathLabLogo size="md" variant="light" />
          </a>
          <div className="flex items-center gap-3 overflow-x-auto">
            <LessonTierNav topicId="falling" active="highschool" />
            <button
              onClick={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden lg:inline text-[11px] font-mono text-sage-light/80 hover:text-gold transition-colors whitespace-nowrap"
            >
              Jump to Python lab ↓
            </button>
          </div>
        </div>
      </header>

      <FallingBallLesson onLoadIntoLab={handleLoadPlanetIntoLab} />

      <section ref={labSectionRef} className="py-12 bg-cream border-b border-sage/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sage/30">
            <div>
              <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold">
                <Terminal className="w-4 h-4 text-gold-hover" />
                <span>Interactive Python Simulation Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
                Step-by-Step Code Laboratory
              </h2>
            </div>
            <p className="text-xs font-mono text-deepteal-soft">
              Edit code or sliders → Watch the canvas & synchronized curves update live.
            </p>
          </div>

          <PythonLabEditor
            activeDomain="classical"
            activeTier="highschool"
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

          <SimulationChallenges />

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
        </div>
      </section>

      <footer className="py-10 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — Lesson 1, high school</span>
          </div>
          <a href="#/" className="text-[11px] hover:text-gold-hover transition-colors">
            ← All topics
          </a>
        </div>
      </footer>
    </div>
  );
}

/**
 * Hash-based routing. No router dependency, and deep links keep working on
 * GitHub Pages, which serves this as a static site under the /simulation/ base.
 *
 *   #/                          → landing page
 *   #/lesson/falling            → Lesson 1, high school
 *   #/lesson/falling/undergrad  → Lesson 1, undergraduate
 *   #/lesson/projectile         → Lesson 2, high school
 *   #/lesson/orbit              → Lesson 3, high school
 */
function useHashRoute(): string {
  const [route, setRoute] = useState<string>(() => window.location.hash || '#/');

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  return route;
}

type View = 'landing' | 'falling-hs' | 'falling-ug' | 'projectile' | 'orbit';

function resolveView(route: string): View {
  // Match the deeper route first — '#/lesson/falling' is a prefix of both.
  if (route.startsWith('#/lesson/falling/undergrad')) return 'falling-ug';
  if (route.startsWith('#/lesson/falling')) return 'falling-hs';
  if (route.startsWith('#/lesson/projectile')) return 'projectile';
  if (route.startsWith('#/lesson/orbit')) return 'orbit';
  return 'landing';
}

const TITLES: Record<View, string> = {
  landing: 'Philomathlab — Learn simulation itself',
  'falling-hs': 'Philomathlab — Lesson 1: What is Falling?',
  'falling-ug': 'Philomathlab — Lesson 1: Falling Body (Undergraduate)',
  projectile: 'Philomathlab — Lesson 2: Projectile Motion',
  orbit: 'Philomathlab — Lesson 3: Orbital Motion',
};

export default function App() {
  const view = resolveView(useHashRoute());

  // Only fires when the view actually flips, so in-page anchors are left alone.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLES[view];
  }, [view]);

  if (view === 'falling-ug') return <FallingUGPage />;
  if (view === 'falling-hs') return <FallingLessonView />;
  if (view === 'projectile') return <ProjectilePage />;
  if (view === 'orbit') return <OrbitalPage />;
  return <LandingPage />;
}
