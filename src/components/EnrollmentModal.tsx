import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, Sparkles, Send, Award } from 'lucide-react';
import { PhilomathLabLogo } from './PhilomathLabLogo';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanName?: string;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  selectedPlanName = 'Numerical Physics Course',
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState<'highschool' | 'undergrad' | 'researcher'>('undergrad');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitted(true);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deepteal/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-card border border-sage rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-deepteal">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-deepteal-soft hover:text-deepteal p-1 rounded-full bg-cream border border-sage"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <PhilomathLabLogo size="lg" layout="vertical" className="mx-auto" />
            <div className="w-14 h-14 bg-sage-light border border-sage text-deepteal rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-deepteal" />
            </div>

            <h3 className="text-2xl font-sans font-bold text-deepteal">
              Welcome to Philomath Lab!
            </h3>

            <p className="text-sm font-sans text-deepteal-soft leading-relaxed">
              We've registered your interest for <strong className="text-deepteal font-bold">{selectedPlanName}</strong>. Check your inbox ({email}) for early cohort orientation materials and launch discounts from <span className="font-mono text-xs text-deepteal">philomathlab.ir</span>.
            </p>

            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded-xl shadow-sm"
            >
              Return to Platform
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sage pb-3">
              <PhilomathLabLogo size="sm" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream border border-sage text-deepteal font-bold">
                Enrollment
              </span>
            </div>

            <h3 className="text-2xl font-sans font-bold text-deepteal">
              Enroll in {selectedPlanName}
            </h3>

            <p className="text-xs font-sans text-deepteal-soft">
              Enter your details to receive syllabus access, live cohort start dates, and direct setup guides for Python simulation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs pt-2">
              <div>
                <label className="block text-deepteal-soft mb-1 font-bold">Full Name:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Alex Mercer"
                  className="w-full px-3 py-2 bg-cream border border-sage rounded-lg text-deepteal focus:outline-none focus:ring-2 focus:ring-gold placeholder-deepteal-soft/60"
                />
              </div>

              <div>
                <label className="block text-deepteal-soft mb-1 font-bold">Email Address:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full px-3 py-2 bg-cream border border-sage rounded-lg text-deepteal focus:outline-none focus:ring-2 focus:ring-gold placeholder-deepteal-soft/60"
                />
              </div>

              <div>
                <label className="block text-deepteal-soft mb-1 font-bold">Academic Level:</label>
                <select
                  value={level}
                  onChange={(e: any) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-cream border border-sage rounded-lg text-deepteal focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="highschool">High School Student</option>
                  <option value="undergrad">Undergraduate Student</option>
                  <option value="researcher">Graduate / Researcher</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded-xl shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2 mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Enrollment Interest</span>
              </button>
            </form>

            <div className="text-[10px] font-mono text-deepteal-soft text-center pt-2">
              <span>philomathlab.ir / philomathlab.com — Zero spam guaranteed.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
