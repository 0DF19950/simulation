import React from 'react';
import { AudienceTier } from '../types';
import { TIER_LABELS, TOPICS } from '../data/topics';

interface LessonTierNavProps {
  /** Topic id from src/data/topics.ts — the tiers and their routes come from there. */
  topicId: string;
  active: AudienceTier;
}

/** Depth switcher for a lesson that ships at more than one level. */
export const LessonTierNav: React.FC<LessonTierNavProps> = ({ topicId, active }) => {
  const tiers = TOPICS.find((t) => t.id === topicId)?.tiers ?? [];
  if (tiers.length === 0) return null;

  return (
    <div className="flex items-center gap-1" role="navigation" aria-label="Lesson depth">
      {tiers.map(({ tier, route }) => {
        const base =
          'font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded transition-colors whitespace-nowrap';

        if (tier === active) {
          return (
            <span key={tier} className={`${base} bg-gold text-deepteal font-bold`} aria-current="page">
              {TIER_LABELS[tier]}
            </span>
          );
        }
        if (!route) {
          return (
            <span key={tier} className={`${base} text-sage-light/40 cursor-default`} title="Planned">
              {TIER_LABELS[tier]}
            </span>
          );
        }
        return (
          <a key={tier} href={route} className={`${base} text-sage-light/80 hover:text-gold`}>
            {TIER_LABELS[tier]}
          </a>
        );
      })}
    </div>
  );
};
