import React from 'react';
import { AudienceTier } from '../types';

interface TierLink {
  tier: AudienceTier;
  label: string;
  route?: string;
}

const TIERS: TierLink[] = [
  { tier: 'highschool', label: 'High School', route: '#/lesson/falling' },
  { tier: 'undergrad', label: 'Undergraduate', route: '#/lesson/falling/undergrad' },
  { tier: 'researcher', label: 'Researcher' },
];

/** Depth switcher for a lesson that ships at more than one level. */
export const LessonTierNav: React.FC<{ active: AudienceTier }> = ({ active }) => (
  <div className="flex items-center gap-1" role="navigation" aria-label="Lesson depth">
    {TIERS.map(({ tier, label, route }) => {
      const isActive = tier === active;
      const base =
        'font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded transition-colors whitespace-nowrap';

      if (isActive) {
        return (
          <span key={tier} className={`${base} bg-gold text-deepteal font-bold`} aria-current="page">
            {label}
          </span>
        );
      }
      if (!route) {
        return (
          <span key={tier} className={`${base} text-sage-light/40 cursor-default`} title="Planned">
            {label}
          </span>
        );
      }
      return (
        <a key={tier} href={route} className={`${base} text-sage-light/80 hover:text-gold`}>
          {label}
        </a>
      );
    })}
  </div>
);
