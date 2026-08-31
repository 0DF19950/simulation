import React from 'react';
import { Wand2 } from 'lucide-react';

export interface Challenge {
  label: string;
  hint: string;
}

interface SimulationChallengesProps {
  challenges?: Challenge[];
  title?: string;
  intro?: React.ReactNode;
}

const CHALLENGES: Challenge[] = [
  { label: 'Simulate the Moon', hint: 'Set g = 1.62 in the code below (or load it from the planet picker above).' },
  { label: "Double Earth's gravity", hint: 'Set g = 19.6 — what happens to the fall time?' },
  { label: 'Add air resistance', hint: 'Increase drag from 0 to 0.1, then 0.5 — watch the trajectory curve bend.' },
  { label: 'Set gravity to zero', hint: 'g = 0 — does the ball ever land?' },
  { label: 'Create upward gravity', hint: 'Try a positive g — predict the shape of the curve before you run it.' },
];

export const SimulationChallenges: React.FC<SimulationChallengesProps> = ({
  challenges = CHALLENGES,
  title = 'Simulation challenges',
  intro,
}) => {
  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-gold-hover" />
        <span>{title}</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        {intro ?? (
          <>
            Predict the outcome before you run each one, then edit <code className="font-mono text-xs bg-cream px-1 py-0.5 rounded border border-sage">acceleration(y, v)</code> above to check yourself.
          </>
        )}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {challenges.map((c, i) => (
          <li key={i} className="bg-cream p-3 rounded-lg border border-sage/60 text-xs font-sans">
            <span className="font-mono font-bold text-deepteal block mb-1">{i + 1}. {c.label}</span>
            <span className="text-deepteal-soft">{c.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
