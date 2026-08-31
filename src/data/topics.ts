import type { LucideIcon } from 'lucide-react';
import { ArrowDownToLine, Atom, Orbit, Waves } from 'lucide-react';
import { AudienceTier, PhysicsDomain } from '../types';

export interface Topic {
  id: string;
  title: string;
  domain: PhysicsDomain;
  /** One or two sentences — what the learner actually builds a simulation of. */
  blurb: string;
  /** 'live' renders a clickable card; 'planned' renders a dimmed one. */
  status: 'live' | 'planned';
  /** Hash route for live topics, e.g. '#/lesson/falling'. Omit when planned. */
  route?: string;
  icon: LucideIcon;
  /** Which lesson depths this topic ships at, and where each one lives. */
  tiers: TopicTier[];
}

export interface TopicTier {
  tier: AudienceTier;
  /** Hash route once that depth has a page; omitted while it is still planned. */
  route?: string;
}

export const DOMAIN_LABELS: Record<PhysicsDomain, string> = {
  classical: 'Classical Mechanics',
  waves: 'Waves & Oscillations',
  modern: 'Modern Physics',
};

export const TIER_LABELS: Record<AudienceTier, string> = {
  highschool: 'High School',
  undergrad: 'Undergraduate',
  researcher: 'Researcher',
};

/** Every depth, none of them built yet — the starting point for a new topic. */
const PLANNED_TIERS: TopicTier[] = [
  { tier: 'highschool' },
  { tier: 'undergrad' },
  { tier: 'researcher' },
];

// ─────────────────────────────────────────────────────────────────────────────
// EDIT HERE to add topics to the landing page.
//
// 'falling' ships at high-school and undergraduate depth. The rest are
// placeholders using the repo's existing PhysicsDomain taxonomy — replace
// their titles and blurbs with the actual topic list, and flip status to
// 'live' + add routes once a lesson page exists behind them.
// ─────────────────────────────────────────────────────────────────────────────
export const TOPICS: Topic[] = [
  {
    id: 'falling',
    title: 'What is Falling?',
    domain: 'classical',
    blurb:
      'Why a dropped object speeds up instead of drifting — then, at undergraduate depth, drag, terminal velocity, Euler vs. RK4, and the numerical error that comes with them.',
    status: 'live',
    route: '#/lesson/falling',
    icon: ArrowDownToLine,
    tiers: [
      { tier: 'highschool', route: '#/lesson/falling' },
      { tier: 'undergrad', route: '#/lesson/falling/undergrad' },
      { tier: 'researcher' },
    ],
  },
  {
    id: 'projectiles',
    title: 'Projectiles & Orbits',
    domain: 'classical',
    blurb:
      'The same falling body, given a sideways push. Trajectories, escape velocity, and the point where a fall becomes an orbit.',
    status: 'planned',
    icon: Orbit,
    tiers: PLANNED_TIERS,
  },
  {
    id: 'oscillations',
    title: 'Oscillations & Waves',
    domain: 'waves',
    blurb:
      'Springs, pendulums, and what happens when a restoring force replaces a constant one. Resonance, damping, and superposition.',
    status: 'planned',
    icon: Waves,
    tiers: PLANNED_TIERS,
  },
  {
    id: 'quantum',
    title: 'Quantum Motion',
    domain: 'modern',
    blurb:
      'When a particle stops having a trajectory. Wavefunctions, probability density, and numerically solving for a particle in a box.',
    status: 'planned',
    icon: Atom,
    tiers: [{ tier: 'undergrad' }, { tier: 'researcher' }],
  },
];
