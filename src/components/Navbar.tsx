import React from 'react';
import { AudienceTier, PhysicsDomain } from '../types';
import { Award } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';

interface NavbarProps {
  activeDomain: PhysicsDomain;
  setActiveDomain: (domain: PhysicsDomain) => void;
  activeTier: AudienceTier;
  setActiveTier: (tier: AudienceTier) => void;
  onOpenEnrollment: () => void;
  onSwitchToWebsite?: () => void;
  onSwitchToPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDomain,
  setActiveDomain,
  activeTier,
  setActiveTier,
  onOpenEnrollment,
  onSwitchToWebsite,
  onSwitchToPortal,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-deepteal border-b border-sage/30 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onSwitchToWebsite || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}>
              <PhilomathLabLogo size="md" variant="light" />
            </div>

            {onSwitchToWebsite && (
              <button
                onClick={onSwitchToWebsite}
                className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded border border-sage/40 bg-deepteal-dark text-cream hover:text-gold transition-colors"
                title="Go to Website Landing Page"
              >
                Website Home
              </button>
            )}

            {onSwitchToPortal && (
              <button
                onClick={onSwitchToPortal}
                className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded border border-gold/50 bg-gold/20 text-gold hover:bg-gold hover:text-deepteal transition-all"
                title="Go to Student Portal"
              >
                Student Portal
              </button>
            )}
          </div>

          {/* Navigation Domains */}
          <nav className="hidden md:flex items-center h-full gap-1">
            <button
              onClick={() => setActiveDomain('classical')}
              className={`px-5 h-16 border-b-2 text-xs font-mono font-bold transition-colors flex items-center ${
                activeDomain === 'classical'
                  ? 'border-gold bg-deepteal-soft/60 text-gold'
                  : 'border-transparent text-sage-light/80 hover:bg-deepteal-soft/30 hover:text-cream'
              }`}
            >
              CLASSICAL PHYSICS
            </button>
            <button
              onClick={() => setActiveDomain('waves')}
              className={`px-5 h-16 border-b-2 text-xs font-mono font-bold transition-colors flex items-center ${
                activeDomain === 'waves'
                  ? 'border-gold bg-deepteal-soft/60 text-gold'
                  : 'border-transparent text-sage-light/80 hover:bg-deepteal-soft/30 hover:text-cream'
              }`}
            >
              WAVES & FIELDS
            </button>
            <button
              onClick={() => setActiveDomain('modern')}
              className={`px-5 h-16 border-b-2 text-xs font-mono font-bold transition-colors flex items-center ${
                activeDomain === 'modern'
                  ? 'border-gold bg-deepteal-soft/60 text-gold'
                  : 'border-transparent text-sage-light/80 hover:bg-deepteal-soft/30 hover:text-cream'
              }`}
            >
              MODERN PHYSICS
            </button>
          </nav>

          {/* Audience Tier Badges & Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-deepteal-dark border border-sage/30 p-1 rounded-md">
              <button
                onClick={() => setActiveTier('highschool')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeTier === 'highschool'
                    ? 'bg-gold text-deepteal font-bold shadow-xs'
                    : 'text-sage-light hover:text-cream'
                }`}
                title="High School Tier"
              >
                <span className={`w-2 h-2 rounded-full inline-block ${activeTier === 'highschool' ? 'bg-deepteal' : 'bg-sage'}`} />
                <span>HS</span>
              </button>
              <button
                onClick={() => setActiveTier('undergrad')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeTier === 'undergrad'
                    ? 'bg-gold text-deepteal font-bold shadow-xs'
                    : 'text-sage-light hover:text-cream'
                }`}
                title="Undergraduate Tier"
              >
                <span className={`w-2 h-2 rounded-full inline-block ${activeTier === 'undergrad' ? 'bg-deepteal' : 'bg-gold'}`} />
                <span>UG</span>
              </button>
              <button
                onClick={() => setActiveTier('researcher')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  activeTier === 'researcher'
                    ? 'bg-gold text-deepteal font-bold shadow-xs'
                    : 'text-sage-light hover:text-cream'
                }`}
                title="Researcher Tier"
              >
                <span className={`w-2 h-2 rounded-full inline-block ${activeTier === 'researcher' ? 'bg-deepteal' : 'bg-sage-light'}`} />
                <span>RES</span>
              </button>
            </div>

            <button
              onClick={onOpenEnrollment}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-bold rounded transition-all shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ENROLL</span>
            </button>

            <span className="hidden xl:inline-block text-[10px] font-mono text-sage/70 border-l border-sage/20 pl-3">
              V.2.4.0_STABLE
            </span>
          </div>
        </div>

        {/* Mobile Domain Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-sage/20 text-xs font-mono">
          <button
            onClick={() => setActiveDomain('classical')}
            className={`px-2 py-1 rounded ${activeDomain === 'classical' ? 'bg-gold text-deepteal font-bold' : 'text-sage-light'}`}
          >
            Classical
          </button>
          <button
            onClick={() => setActiveDomain('waves')}
            className={`px-2 py-1 rounded ${activeDomain === 'waves' ? 'bg-gold text-deepteal font-bold' : 'text-sage-light'}`}
          >
            Waves & Fields
          </button>
          <button
            onClick={() => setActiveDomain('modern')}
            className={`px-2 py-1 rounded ${activeDomain === 'modern' ? 'bg-gold text-deepteal font-bold' : 'text-sage-light'}`}
          >
            Modern
          </button>
        </div>
      </div>
    </header>
  );
};

