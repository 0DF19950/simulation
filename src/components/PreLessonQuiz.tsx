import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
}

interface PreLessonQuizProps {
  questions?: QuizQuestion[];
  title?: string;
  intro?: string;
  /** One option per row — for long, wordy answer choices. */
  singleColumn?: boolean;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'If you drop a ball from a building, does it...',
    options: [
      { id: 'a', text: 'Fall at a constant speed' },
      { id: 'b', text: 'Speed up continuously' },
      { id: 'c', text: 'Slow down' },
      { id: 'd', text: 'First speed up, then slow down' },
    ],
    correctId: 'b',
    explanation: 'Gravity is a constant acceleration, not a one-time push — velocity keeps increasing the whole way down.',
  },
  {
    id: 'q2',
    prompt: 'If you drop the same ball on the Moon, what happens?',
    options: [
      { id: 'a', text: 'It falls faster' },
      { id: 'b', text: 'It falls slower' },
      { id: 'c', text: 'It falls exactly the same' },
    ],
    correctId: 'b',
    explanation: "The Moon's gravity (1.62 m/s²) is about a sixth of Earth's, so the ball accelerates — and falls — much more slowly.",
  },
  {
    id: 'q3',
    prompt: 'If you drop a feather and a bowling ball in a vacuum, which reaches the ground first?',
    options: [
      { id: 'a', text: 'Feather' },
      { id: 'b', text: 'Bowling ball' },
      { id: 'c', text: 'Same time' },
    ],
    correctId: 'c',
    explanation: 'Without air resistance, gravity accelerates every mass equally — the famous Apollo 15 hammer-and-feather demonstration on the Moon.',
  },
];

export const PreLessonQuiz: React.FC<PreLessonQuizProps> = ({
  questions = QUESTIONS,
  title = "Before we calculate anything — what's your intuition?",
  intro = "Answer these without doing any math. There's no scoring — we'll come back to them once the physics makes the answers obvious.",
  singleColumn = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const select = (qId: string, optId: string) => {
    if (answers[qId]) return; // lock after first answer
    setAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-gold-hover" />
        <span>{title}</span>
      </h3>
      <p className="text-sm text-deepteal-soft">{intro}</p>

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="bg-cream p-3.5 rounded-lg border border-sage/60">
              <p className="text-sm font-sans font-semibold text-deepteal mb-2">
                {qi + 1}. {q.prompt}
              </p>
              <div className={`grid gap-2 ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {q.options.map((opt) => {
                  const isChosen = chosen === opt.id;
                  const isCorrect = opt.id === q.correctId;
                  const showState = !!chosen;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => select(q.id, opt.id)}
                      disabled={!!chosen}
                      className={`flex items-center justify-between gap-2 text-left text-sm font-mono px-3 py-2 rounded border transition-colors ${
                        showState && isCorrect
                          ? 'bg-sage-light border-sage-dark text-deepteal font-bold'
                          : showState && isChosen && !isCorrect
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-cream-card border-sage text-deepteal-soft hover:border-gold'
                      } ${chosen ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span>{opt.text}</span>
                      {showState && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      {showState && isChosen && !isCorrect && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {chosen && (
                <p className="text-xs text-deepteal-soft font-sans mt-2 pl-0.5">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
