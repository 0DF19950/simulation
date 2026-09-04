import React, { useRef } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { DOMAIN_LABELS, TIER_LABELS, TOPICS, Topic } from '../data/topics';
import { AudienceTier } from '../types';

const TIER_ORDER: AudienceTier[] = ['highschool', 'undergrad', 'researcher'];

// Depth descriptions follow the three lab starting points already shipped in
// the Python editor: plain kinematics, drag + RK4, then stochastic forcing.
const TIER_NOTES: Record<AudienceTier, string> = {
  highschool: 'The idea and the equation, driven by sliders rather than algebra.',
  undergrad: 'Derivations that hold up, plus air drag and RK4 integration.',
  researcher: 'Atmospheric density, stochastic forces, and code built to extend.',
};

const TopicCard: React.FC<{ topic: Topic }> = ({ topic }) => {
  const Icon = topic.icon;
  const isLive = topic.status === 'live';

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isLive
              ? 'border-gold/40 bg-gold-light text-deepteal group-hover:border-gold group-hover:bg-gold'
              : 'border-sage/50 bg-sage-light/50 text-deepteal-soft'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>

        {isLive ? (
          <a href={topic.route} aria-label={`Open ${topic.title}`} className="mt-1 shrink-0">
            <ArrowRight className="h-4 w-4 text-sage-dark transition-all group-hover:translate-x-0.5 group-hover:text-gold-hover" />
          </a>
        ) : (
          <span className="mt-0.5 rounded-full border border-sage/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-deepteal-soft/70">
            Planned
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sage-dark">
          {DOMAIN_LABELS[topic.domain]}
        </p>
        <h3 className="text-lg font-bold leading-snug text-deepteal">
          {isLive ? (
            <a href={topic.route} className="transition-colors hover:text-gold-hover">
              {topic.title}
            </a>
          ) : (
            topic.title
          )}
        </h3>
        <p className="text-sm leading-relaxed text-deepteal-soft">{topic.blurb}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-sage/30 pt-3">
        {topic.tiers.map(({ tier, route }) =>
          route ? (
            <a
              key={tier}
              href={route}
              className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-gold/50 bg-gold-light/40 text-gold-hover transition-colors hover:border-gold hover:bg-gold hover:text-deepteal"
            >
              {TIER_LABELS[tier]}
            </a>
          ) : (
            <span
              key={tier}
              className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 text-deepteal-soft/60"
            >
              {TIER_LABELS[tier]}
            </span>
          )
        )}
      </div>
    </>
  );

  const shared =
    'group flex flex-col rounded-xl border p-5 text-left transition-all duration-200';

  if (!isLive) {
    return <div className={`${shared} border-sage/40 bg-cream-card/60 opacity-70`}>{body}</div>;
  }

  return (
    <div
      className={`${shared} border-sage/60 bg-cream-card hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-deepteal/5 focus-within:border-gold`}
    >
      {body}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const topicsRef = useRef<HTMLDivElement>(null);
  const liveTopic = TOPICS.find((topic) => topic.status === 'live');

  return (
    <div className="min-h-screen text-deepteal antialiased selection:bg-gold selection:text-deepteal">
      <header className="sticky top-0 z-50 border-b border-sage/30 bg-deepteal shadow-md backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <PhilomathLabLogo size="md" variant="light" />
          <button
            onClick={() => topicsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="font-mono text-[11px] text-sage-light/80 transition-colors hover:text-gold"
          >
            Browse topics ↓
          </button>
        </div>
      </header>

      {/* Hero — left transparent so the body's dotted paper grid shows through */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-dark">
            Philomathlab
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Learn simulation
            <span className="text-gold-hover"> itself</span>.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-deepteal-soft">
            Math, physics, and programming taught together — rather than picked up as a side
            effect of a research project. Every topic is a lesson, a derivation you can follow,
            and a real Python lab that runs in your browser.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {liveTopic && (
              <a
                href={liveTopic.route}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-deepteal px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deepteal-soft"
              >
                Start with {liveTopic.title}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => topicsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sage-dark/50 px-5 py-3 text-sm font-semibold text-deepteal transition-colors hover:border-gold hover:text-gold-hover"
            >
              See all topics
            </button>
          </div>

          <div className="mt-10 flex items-center gap-3 font-mono text-xs text-deepteal-soft/80">
            <Terminal className="h-4 w-4 shrink-0 text-gold-hover" />
            <span>y(t) = y₀ + v₀t − ½gt²  —  and the code that solves it</span>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section ref={topicsRef} className="border-y border-sage/40 bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 border-b border-sage/30 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sage-dark">
                The catalogue
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Topics</h2>
            </div>
            <p className="font-mono text-xs text-deepteal-soft">
              Each topic ships as lesson + derivation + live Python lab.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      </section>

      {/* Depths */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sage-dark">
              One topic, three depths
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              The same problem, at your level
            </h2>
            <p className="mt-3 leading-relaxed text-deepteal-soft">
              A falling body is a falling body whether you are sixteen or writing a paper. What
              changes is how far down the model you go.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TIER_ORDER.map((tier, index) => (
              <div
                key={tier}
                className="rounded-xl border border-sage/50 bg-cream-card p-5"
              >
                <span className="font-mono text-xs font-bold text-gold-hover">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-base font-bold text-deepteal">{TIER_LABELS[tier]}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-deepteal-soft">
                  {TIER_NOTES[tier]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-sage/40 bg-cream-card py-10 font-mono text-xs text-deepteal-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="sm" />
            <span className="text-[11px]">philomathlab.com — early preview</span>
          </div>
          <span className="text-[11px]">Real Python, running in your browser via Pyodide.</span>
        </div>
      </footer>
    </div>
  );
};
