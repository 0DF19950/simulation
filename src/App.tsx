import React, { useState, useEffect, useRef } from 'react';
import { AudienceTier, PhysicsDomain, PhysicsModule, SimulationParams, TrajectoryPoint } from './types';
import { PHYSICS_MODULES } from './data/physicsData';
import { Navbar } from './components/Navbar';
import { HeroInstrument } from './components/HeroInstrument';
import { FallingBallLesson } from './components/FallingBallLesson';
import { PygameCanvasVisualizer } from './components/PygameCanvasVisualizer';
import { PythonLabEditor } from './components/PythonLabEditor';
import { InteractivePlots } from './components/InteractivePlots';
import { DomainExplorer } from './components/DomainExplorer';
import { TierComparisonSection } from './components/TierComparisonSection';
import { MarketingCoursePricing } from './components/MarketingCoursePricing';
import { EnrollmentModal } from './components/EnrollmentModal';
import { PhilomathLabLogo } from './components/PhilomathLabLogo';
import { WebsiteLandingPage } from './components/WebsiteLandingPage';
import { StudentCoursePortal } from './components/StudentCoursePortal';
import { exportTrajectoryToCSV, runNumericalSimulation } from './utils/simulationEngine';
import { Terminal, Sparkles, BookOpen, Layers, Award, Heart, Globe, ArrowLeft, Home } from 'lucide-react';

export default function App() {
  // Navigation View Mode: 'landing' (website) | 'portal' (student course material portal) | 'simulation' (full lab)
  const [viewMode, setViewMode] = useState<'landing' | 'portal' | 'simulation'>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  const [activeDomain, setActiveDomain] = useState<PhysicsDomain>('classical');
  const [activeTier, setActiveTier] = useState<AudienceTier>('highschool');

  // Simulation parameters state
  const [params, setParams] = useState<SimulationParams>({
    gravity: 9.81,
    initialHeight: 50.0,
    initialVelocity: 0.0,
    dragCoefficient: 0.0,
    mass: 1.0,
    dt: 0.02,
    method: 'euler',
  });

  // Code override string when user clicks "Load into Lab"
  const [codeOverride, setCodeOverride] = useState<string>('');

  // Computed trajectory points
  const [points, setPoints] = useState<TrajectoryPoint[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Pyodide & Execution state
  const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Enrollment modal state
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState<boolean>(false);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('Numerical Physics Course');

  const pyodideInstanceRef = useRef<any>(null);
  const labSectionRef = useRef<HTMLDivElement>(null);
  const tiersSectionRef = useRef<HTMLDivElement>(null);
  const lessonSectionRef = useRef<HTMLDivElement>(null);

  // Initialize Pyodide client-side Python execution in background
  useEffect(() => {
    async function initPyodideRuntime() {
      try {
        if ((window as any).loadPyodide) {
          const pyodide = await (window as any).loadPyodide();
          pyodideInstanceRef.current = pyodide;
          setIsPyodideReady(true);
        }
      } catch (e) {
        console.warn('Pyodide runtime background loading deferred to JS solver:', e);
      }
    }
    initPyodideRuntime();
  }, []);

  // Run initial simulation whenever parameters update
  useEffect(() => {
    const trajectory = runNumericalSimulation(params);
    setPoints(trajectory);
    setCurrentStepIndex(0);
  }, [params]);

  // Execute custom Python code or fall back to numerical engine
  const handleRunPythonSimulation = async (customCode: string) => {
    setErrorMessage('');
    setIsExecuting(true);
    setIsPlaying(false);

    try {
      if (pyodideInstanceRef.current) {
        // Run code inside Pyodide Python environment
        const pyodide = pyodideInstanceRef.current;
        const runnerScript = `
import json

${customCode}

def __run_sim():
    y = ${params.initialHeight}
    v = ${params.initialVelocity}
    t = 0.0
    dt = ${params.dt}
    mass = ${params.mass}
    g = ${params.gravity}
    pts = []
    
    steps = 0
    while y > -0.01 and steps < 4000:
        a = acceleration(y, v)
        ek = 0.5 * mass * v * v
        ep = mass * g * max(y, 0)
        pts.append({
            "t": round(t, 4),
            "y": round(max(y, 0), 4),
            "v": round(v, 4),
            "a": round(float(a), 4),
            "ek": round(ek, 2),
            "ep": round(ep, 2),
            "etotal": round(ek + ep, 2)
        })
        if y <= 0 and steps > 0:
            break
            
        v += a * dt
        y += v * dt
        t += dt
        steps += 1
        
    return json.dumps(pts)

__run_sim()
`;
        const jsonResult = await pyodide.runPythonAsync(runnerScript);
        const parsedPoints = JSON.parse(jsonResult);
        setPoints(parsedPoints);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      } else {
        // Run with JS engine
        const trajectory = runNumericalSimulation(params);
        setPoints(trajectory);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
      // Fallback
      const trajectory = runNumericalSimulation(params);
      setPoints(trajectory);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handler when user selects celestial body from Lesson 1
  const handleLoadPlanetIntoLab = (g: number, planetName: string) => {
    setViewMode('simulation');
    setParams((prev) => ({ ...prev, gravity: g }));
    const code = `# Loaded from lesson: Free fall on ${planetName}
def acceleration(y, v):
    g = ${g.toFixed(2)}        # Gravity on ${planetName} (m/s^2)
    drag = ${params.dragCoefficient.toFixed(2)}     # Air drag coefficient
    return -g - drag * v * abs(v)`;
    setCodeOverride(code);

    setTimeout(() => {
      if (labSectionRef.current) {
        labSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Handler when user selects a domain module card
  const handleSelectModule = (module: PhysicsModule) => {
    setViewMode('simulation');
    setActiveDomain(module.domain);
    setActiveTier(module.tier);
    setParams(module.defaultParams);
    setCodeOverride(module.defaultPythonCode);

    setTimeout(() => {
      if (labSectionRef.current) {
        labSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Handler when user selects a tier code template
  const handleSelectTierCode = (tier: AudienceTier) => {
    setActiveTier(tier);
    setCodeOverride('');
    if (labSectionRef.current) {
      labSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenEnrollmentModal = (planName?: string) => {
    if (planName) setSelectedPlanName(planName);
    setIsEnrollmentOpen(true);
  };

  // 1. Website Landing View Mode
  if (viewMode === 'landing') {
    return (
      <WebsiteLandingPage
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onAccessPhysicsCourse={(domain) => {
          if (domain) setActiveDomain(domain);
          setViewMode('portal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  // 2. Student Course Portal View Mode
  if (viewMode === 'portal') {
    return (
      <StudentCoursePortal
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        activeTier={activeTier}
        setActiveTier={setActiveTier}
        onSelectModule={handleSelectModule}
        onReturnToLanding={() => setViewMode('landing')}
        onOpenSimulationLab={() => {
          setViewMode('simulation');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMasterclassLesson={() => {
          setViewMode('simulation');
          setTimeout(() => {
            lessonSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />
    );
  }

  // 3. Full Interactive Simulation Lab View Mode
  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans antialiased selection:bg-gold selection:text-deepteal">
      {/* Top Banner Navigation bar to toggle views */}
      <div className="bg-gold text-deepteal px-4 py-2 flex items-center justify-between text-xs font-mono font-bold shadow-xs border-b border-deepteal/20">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1 text-deepteal hover:underline font-bold"
            >
              <Home className="w-4 h-4" />
              <span>Main Website Home</span>
            </button>
            <span>/</span>
            <button
              onClick={() => setViewMode('portal')}
              className="flex items-center gap-1 text-deepteal hover:underline font-bold"
            >
              <span>Student Course Portal</span>
            </button>
          </div>
          <span className="hidden sm:inline bg-deepteal text-gold px-2.5 py-0.5 rounded text-[11px]">
            ACTIVE SIMULATION LAB
          </span>
        </div>
      </div>

      {/* Main App Navbar */}
      <Navbar
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        activeTier={activeTier}
        setActiveTier={setActiveTier}
        onOpenEnrollment={() => handleOpenEnrollmentModal('General Course Access')}
        onSwitchToWebsite={() => setViewMode('landing')}
        onSwitchToPortal={() => setViewMode('portal')}
      />

      {/* Hero Header */}
      <HeroInstrument
        onJumpToLab={() => labSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onJumpToTiers={() => tiersSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Exemplar Masterclass Lesson: "What is Falling?" */}
      <div ref={lessonSectionRef}>
        <FallingBallLesson onLoadIntoLab={handleLoadPlanetIntoLab} />
      </div>

      {/* Interactive Python Simulation Lab */}
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
              Edit code or sliders → Watch Pygame canvas & synchronized curves update live.
            </p>
          </div>

          {/* Editor & Sliders */}
          <PythonLabEditor
            activeDomain={activeDomain}
            activeTier={activeTier}
            params={params}
            setParams={setParams}
            onRunSimulation={handleRunPythonSimulation}
            onResetParams={() => {
              setParams({
                gravity: 9.81,
                initialHeight: 50.0,
                initialVelocity: 0.0,
                dragCoefficient: 0.0,
                mass: 1.0,
                dt: 0.02,
                method: 'euler',
              });
              setCodeOverride('');
            }}
            isPyodideReady={isPyodideReady}
            isExecuting={isExecuting}
            errorMessage={errorMessage}
            onExportCSV={() => exportTrajectoryToCSV(points)}
            initialCodeOverride={codeOverride}
          />

          {/* Synchronized Visualizers: Pygame View + Recharts Plots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PygameCanvasVisualizer
              domain={activeDomain}
              params={params}
              points={points}
              currentStepIndex={currentStepIndex}
              setCurrentStepIndex={setCurrentStepIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onReset={() => setCurrentStepIndex(0)}
            />

            <InteractivePlots points={points} />
          </div>

        </div>
      </section>

      {/* Domain Curriculum Modules Explorer */}
      <DomainExplorer
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        activeTier={activeTier}
        onSelectModule={handleSelectModule}
      />

      {/* Audience Tier Complexity Comparison */}
      <div ref={tiersSectionRef}>
        <TierComparisonSection
          activeTier={activeTier}
          setActiveTier={setActiveTier}
          onSelectTierCode={handleSelectTierCode}
        />
      </div>

      {/* Course Enrollment & Commercial Marketing Section */}
      <MarketingCoursePricing onOpenEnrollment={handleOpenEnrollmentModal} />

      {/* Footer */}
      <footer className="py-12 bg-cream-card border-t border-sage/40 font-mono text-xs text-deepteal-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <PhilomathLabLogo size="md" />
              <span className="text-xs font-mono text-deepteal font-bold">
                (philomathlab.ir / philomathlab.com)
              </span>
            </div>
            <p className="text-[11px] text-deepteal-soft font-sans">
              Teaching physics, mathematics, and programming together through simulation as a first-class discipline.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleOpenEnrollmentModal('Waitlist Access')}
              className="px-4 py-2 bg-cream hover:bg-sage-light/50 text-deepteal rounded-lg border border-sage font-mono text-xs transition-all"
            >
              Join Waitlist
            </button>
            <button
              onClick={() => handleOpenEnrollmentModal('Course Enrollment')}
              className="px-4 py-2 bg-gold hover:bg-gold-hover text-deepteal rounded-lg font-mono text-xs font-bold shadow-sm transition-all"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </footer>

      {/* Lead Generation & Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        selectedPlanName={selectedPlanName}
      />
    </div>
  );
}
