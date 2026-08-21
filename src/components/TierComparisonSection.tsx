import React from 'react';
import { AudienceTier, CourseTierInfo } from '../types';
import { COURSE_TIERS } from '../data/physicsData';
import { MathFormula, MathText } from './MathFormula';
import { Activity, CheckCircle, Code, GraduationCap, Sparkles } from 'lucide-react';

interface TierComparisonSectionProps {
  activeTier: AudienceTier;
  setActiveTier: (tier: AudienceTier) => void;
  onSelectTierCode: (tier: AudienceTier) => void;
}

export const TierComparisonSection: React.FC<TierComparisonSectionProps> = ({
  activeTier,
  setActiveTier,
  onSelectTierCode,
}) => {
  const currentTierInfo = COURSE_TIERS.find((t) => t.tier === activeTier) || COURSE_TIERS[0];

  return (
    <section id="tiers" className="py-12 bg-cream border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase font-semibold mb-1">
            <GraduationCap className="w-4 h-4 text-gold-hover" />
            <span>One Physical Phenomenon · Three Depths</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
            Tailored Complexity for High School, Undergrad & Researcher
          </h2>
          <p className="text-sm sm:text-base text-deepteal-soft font-sans max-w-3xl mt-1">
            Every tier revisits the same physics simulation — the depth of calculus, error scaling, and numerical questions changes, while the Python engine under the hood scales smoothly.
          </p>
        </div>

        {/* Tier Toggle Switch */}
        <div className="inline-flex bg-cream-card p-1.5 rounded-xl border border-sage mb-6">
          {COURSE_TIERS.map((tier) => (
            <button
              key={tier.tier}
              onClick={() => setActiveTier(tier.tier)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                activeTier === tier.tier
                  ? 'bg-gold text-deepteal shadow-sm'
                  : 'text-deepteal-soft hover:text-deepteal hover:bg-cream'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Selected Tier Info Card */}
        <div className="bg-cream-card border border-sage rounded-xl p-6 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-block font-mono text-xs px-2.5 py-1 rounded bg-cream border border-sage text-deepteal font-bold">
              Level: {currentTierInfo.label}
            </div>

            <h3 className="text-2xl font-sans font-bold text-deepteal">
              {currentTierInfo.tagline}
            </h3>

            <div className="space-y-3 font-sans text-sm text-deepteal-soft">
              <div className="bg-cream p-3 rounded-lg border border-sage">
                <span className="font-mono font-bold text-xs text-deepteal block mb-1">
                  📚 Prerequisites:
                </span>
                <MathText text={currentTierInfo.prerequisites} />
              </div>

              <div className="bg-cream p-3 rounded-lg border border-sage">
                <span className="font-mono font-bold text-xs text-deepteal block mb-1">
                  📐 Mathematical Focus:
                </span>
                <MathText text={currentTierInfo.mathFocus} />
              </div>

              <div className="bg-cream p-3 rounded-lg border border-sage">
                <span className="font-mono font-bold text-xs text-deepteal block mb-1">
                  💻 Programming Depth:
                </span>
                <MathText text={currentTierInfo.programmingDepth} />
              </div>
            </div>

            <button
              onClick={() => onSelectTierCode(activeTier)}
              className="flex items-center gap-2 py-2.5 px-4 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded transition-transform active:scale-98 shadow-sm"
            >
              <Code className="w-4 h-4 text-deepteal" />
              <span>Load {currentTierInfo.label} Template into Python Lab</span>
            </button>
          </div>

          {/* Sample Code Display */}
          <div className="lg:col-span-6 bg-deepteal text-cream rounded-xl p-5 border border-sage/40 shadow-inner space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-sage/30">
              <span className="text-gold font-bold">
                {currentTierInfo.label.toLowerCase()}_falling_body.py
              </span>
              <span className="text-sage-light text-[10px]">Python 3.11</span>
            </div>

            <pre className="overflow-x-auto text-sage-light leading-relaxed font-mono">
              <code>{currentTierInfo.sampleCode}</code>
            </pre>
          </div>

        </div>

      </div>
    </section>
  );
};
