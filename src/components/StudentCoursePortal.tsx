import React from 'react';
import { PhysicsDomain, PhysicsModule } from '../types';
import { PHYSICS_MODULES } from '../data/physicsData';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Terminal,
  UserCheck,
  Compass,
  Cpu,
  Activity,
  Home,
  CheckCircle2,
  Play,
  BookOpen
} from 'lucide-react';

interface StudentCoursePortalProps {
  activeDomain: PhysicsDomain;
  setActiveDomain: (domain: PhysicsDomain) => void;
  onSelectModule?: (module: PhysicsModule) => void;
  onReturnToLanding: () => void;
  onOpenSimulationLab: () => void;
  studentName?: string;
}

export const StudentCoursePortal: React.FC<StudentCoursePortalProps> = ({
  activeDomain,
  setActiveDomain,
  onSelectModule,
  onReturnToLanding,
  onOpenSimulationLab,
  studentName = 'Alex Newton',
}) => {
  const currentDomainModules = PHYSICS_MODULES.filter((m) => m.domain === activeDomain);

  const handleDomainSelect = (domain: PhysicsDomain) => {
    setActiveDomain(domain);
  };

  const handleModuleClick = (module: PhysicsModule) => {
    if (onSelectModule) {
      onSelectModule(module);
    } else {
      setActiveDomain(module.domain);
      onOpenSimulationLab();
    }
  };

  return (
    <div className="min-h-screen bg-cream text-deepteal font-sans selection:bg-gold selection:text-deepteal flex flex-col">
      {/* Portal Top Bar */}
      <div className="bg-deepteal text-cream border-b border-sage/30 px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-deepteal-dark hover:bg-gold hover:text-deepteal text-gold font-mono text-xs font-bold rounded-lg border border-sage/30 transition-all"
              title="Return to Main Website Landing"
            >
              <Home className="w-4 h-4" />
              <span>Website Home</span>
            </button>
            <div className="h-4 w-px bg-sage/30 hidden sm:block" />
            <PhilomathLabLogo size="sm" variant="light" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-deepteal-dark px-3 py-1 rounded-full border border-sage/30 text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span className="text-cream">Student Portal: <strong className="text-gold">{studentName}</strong></span>
            </div>

            <button
              onClick={onOpenSimulationLab}
              className="flex items-center gap-1.5 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <Terminal className="w-4 h-4" />
              <span>Open Python Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-b from-deepteal to-deepteal-dark text-cream py-8 px-4 border-b border-sage/30">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-mono font-bold">
            <GraduationCap className="w-4 h-4" />
            <span>PhilomathLab Interactive Course Syllabus</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-cream">
            Student Physics Portal
          </h1>
          <p className="text-sm text-sage-light max-w-3xl leading-relaxed">
            Select a domain below to browse its 5 core simulation topics, then load any topic directly into the Python laboratory workspace.
          </p>
        </div>
      </section>

      {/* Physics Domain Tabs / Cards Selection */}
      <section className="py-8 px-4 bg-cream flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Domain Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Domain 1: Classical Physics */}
            <div
              onClick={() => handleDomainSelect('classical')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                activeDomain === 'classical'
                  ? 'bg-cream border-gold shadow-xl ring-2 ring-gold/40 -translate-y-1'
                  : 'bg-cream/60 border-sage/40 hover:border-gold hover:bg-cream'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 text-deepteal flex items-center justify-center">
                    <Compass className="w-5 h-5 text-deepteal" />
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-deepteal text-gold px-2.5 py-0.5 rounded-full">
                    🟢 Tier 1
                  </span>
                </div>
                <h3 className="text-xl font-sans font-bold text-deepteal mb-1">
                  Classical Physics
                </h3>
                <p className="text-xs text-deepteal-soft mb-3">
                  Kinematics, conservation laws, oscillators, orbits, and rigid bodies.
                </p>
                <ul className="text-xs font-mono text-deepteal space-y-1 my-3 pl-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Projectile & 2D Motion</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Collisions & Conservation Laws</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Oscillations & Coupled Oscillators</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Orbital Dynamics & Three-Body Problem</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Rigid Body Dynamics</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-sage/30 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-deepteal-soft">5 Topics</span>
                <span className={`flex items-center gap-1 ${activeDomain === 'classical' ? 'text-gold-hover font-extrabold' : 'text-deepteal'}`}>
                  {activeDomain === 'classical' ? 'Selected Domain' : 'Select Domain'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Domain 2: Waves & Fields */}
            <div
              onClick={() => handleDomainSelect('waves')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                activeDomain === 'waves'
                  ? 'bg-cream border-gold shadow-xl ring-2 ring-gold/40 -translate-y-1'
                  : 'bg-cream/60 border-sage/40 hover:border-gold hover:bg-cream'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 text-deepteal flex items-center justify-center">
                    <Activity className="w-5 h-5 text-deepteal" />
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-deepteal text-gold px-2.5 py-0.5 rounded-full">
                    🔵 Tier 2
                  </span>
                </div>
                <h3 className="text-xl font-sans font-bold text-deepteal mb-1">
                  Waves & Fields
                </h3>
                <p className="text-xs text-deepteal-soft mb-3">
                  Wave propagation, diffraction, electrostatics, Maxwell waves, and fluids.
                </p>
                <ul className="text-xs font-mono text-deepteal space-y-1 my-3 pl-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Wave Propagation</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Interference & Diffraction</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Electrostatic Fields</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Electromagnetic Waves</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Fluid Dynamics</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-sage/30 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-deepteal-soft">5 Topics</span>
                <span className={`flex items-center gap-1 ${activeDomain === 'waves' ? 'text-gold-hover font-extrabold' : 'text-deepteal'}`}>
                  {activeDomain === 'waves' ? 'Selected Domain' : 'Select Domain'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Domain 3: Modern Physics */}
            <div
              onClick={() => handleDomainSelect('modern')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                activeDomain === 'modern'
                  ? 'bg-cream border-gold shadow-xl ring-2 ring-gold/40 -translate-y-1'
                  : 'bg-cream/60 border-sage/40 hover:border-gold hover:bg-cream'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 text-deepteal flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-deepteal" />
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-deepteal text-gold px-2.5 py-0.5 rounded-full">
                    🟣 Tier 3
                  </span>
                </div>
                <h3 className="text-xl font-sans font-bold text-deepteal mb-1">
                  Modern Physics
                </h3>
                <p className="text-xs text-deepteal-soft mb-3">
                  Relativity, blackbody quanta, photoelectric effect, wave mechanics, and Monte Carlo.
                </p>
                <ul className="text-xs font-mono text-deepteal space-y-1 my-3 pl-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Special Relativity</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Blackbody Radiation & Quantization</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Photoelectric Effect</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Quantum Wave Mechanics</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold-hover shrink-0" /> Quantum Monte Carlo & Probability</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-sage/30 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-deepteal-soft">5 Topics</span>
                <span className={`flex items-center gap-1 ${activeDomain === 'modern' ? 'text-gold-hover font-extrabold' : 'text-deepteal'}`}>
                  {activeDomain === 'modern' ? 'Selected Domain' : 'Select Domain'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Active Domain Topic List */}
          <div className="bg-cream-card border-2 border-sage/40 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sage/30 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-deepteal uppercase">
                  <BookOpen className="w-4 h-4 text-gold-hover" />
                  <span>Topic Modules in {activeDomain.toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-sans font-bold text-deepteal">
                  5 Core Course Topics
                </h2>
              </div>
              <span className="text-xs font-mono bg-gold text-deepteal px-3 py-1 rounded-full font-bold">
                Click any topic to load into Lab
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentDomainModules.map((module, idx) => (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  className="bg-cream border border-sage/50 hover:border-gold p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-deepteal text-gold font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="text-lg font-sans font-bold text-deepteal group-hover:text-gold-hover transition-colors">
                        {module.title}
                      </h3>
                    </div>
                    <p className="text-xs text-deepteal-soft pl-8 leading-relaxed">
                      {module.shortDesc}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(module);
                    }}
                    className="px-4 py-2 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-2 shrink-0 self-start md:self-auto"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load into Lab</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Launch CTA */}
          <div className="bg-gradient-to-r from-deepteal to-deepteal-dark text-cream p-6 rounded-2xl border border-gold/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-xl font-sans font-bold text-cream flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Launch Simulation Lab for {activeDomain.toUpperCase()}
              </h3>
              <p className="text-xs text-sage-light">
                Execute Python scripts, adjust parameters in real-time, and view live motion animation on the Pygame canvas.
              </p>
            </div>
            <button
              onClick={onOpenSimulationLab}
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-extrabold rounded-xl transition-all shadow-lg shrink-0 flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Interactive Workspace</span>
            </button>
          </div>

        </div>
      </section>
    </div>
  );
};
