import React from 'react';
import { AudienceTier, PhysicsDomain, PhysicsModule } from '../types';
import { PHYSICS_MODULES } from '../data/physicsData';
import { MathFormula, MathText } from './MathFormula';
import { Layers, ArrowRight, Zap, Sparkles, CheckCircle, Code } from 'lucide-react';

interface DomainExplorerProps {
  activeDomain: PhysicsDomain;
  setActiveDomain: (domain: PhysicsDomain) => void;
  activeTier: AudienceTier;
  onSelectModule: (module: PhysicsModule) => void;
}

export const DomainExplorer: React.FC<DomainExplorerProps> = ({
  activeDomain,
  setActiveDomain,
  activeTier,
  onSelectModule,
}) => {
  const currentDomainModules = PHYSICS_MODULES.filter((m) => m.domain === activeDomain);

  return (
    <section className="py-12 bg-cream border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Domain Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-sage/30 gap-4">
          <div>
            <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold mb-1">
              <Layers className="w-4 h-4 text-gold-hover" />
              <span>Core Physics Curriculum Domains</span>
            </div>
            <h2 className="text-2xl font-sans font-bold text-deepteal">
              Interactive Domain Modules
            </h2>
          </div>

          {/* Domain Pills */}
          <div className="flex items-center gap-2 bg-cream-card p-1.5 rounded-xl border border-sage">
            <button
              onClick={() => setActiveDomain('classical')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeDomain === 'classical'
                  ? 'bg-gold text-deepteal shadow-sm'
                  : 'text-deepteal-soft hover:text-deepteal hover:bg-cream'
              }`}
            >
              Classical Physics
            </button>

            <button
              onClick={() => setActiveDomain('waves')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeDomain === 'waves'
                  ? 'bg-gold text-deepteal shadow-sm'
                  : 'text-deepteal-soft hover:text-deepteal hover:bg-cream'
              }`}
            >
              Waves & Fields
            </button>

            <button
              onClick={() => setActiveDomain('modern')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeDomain === 'modern'
                  ? 'bg-gold text-deepteal shadow-sm'
                  : 'text-deepteal-soft hover:text-deepteal hover:bg-cream'
              }`}
            >
              Modern Physics
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentDomainModules.map((module) => (
            <div
              key={module.id}
              className="bg-cream-card border border-sage rounded-xl p-6 shadow-sm hover:border-gold transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cream border border-sage text-deepteal font-bold uppercase">
                    Tier: {module.tier}
                  </span>
                  <span className="text-xs font-mono text-deepteal-soft font-bold capitalize">
                    {module.domain}
                  </span>
                </div>

                <h3 className="text-xl font-sans font-bold text-deepteal">
                  {module.title}
                </h3>

                <p className="text-sm font-sans text-deepteal-soft leading-relaxed">
                  {module.fullDesc}
                </p>

                {/* LaTeX Equations Box */}
                <div className="bg-cream p-3 rounded-lg border border-sage space-y-2 overflow-x-auto">
                  <span className="font-mono text-[11px] text-deepteal-soft font-bold block uppercase">
                    Key Mathematical Governing Equations:
                  </span>
                  <div className="space-y-1">
                    {module.mathLaTeX.map((eq, i) => (
                      <div key={i} className="text-xs">
                        <MathFormula latex={eq} block />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Simulate Box */}
                <div className="bg-deepteal/5 p-3 rounded-lg border border-sage text-xs font-sans text-deepteal-soft">
                  <strong className="text-deepteal font-mono block mb-0.5">
                    💡 Why code simulation is required here:
                  </strong>
                  <MathText text={module.whySimulateReason} />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onSelectModule(module)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded transition-transform active:scale-98 shadow-sm"
              >
                <Code className="w-4 h-4 text-deepteal" />
                <span>Load Module into Interactive Python Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
