import React, { useState } from 'react';
import { PhilomathLabLogo } from './PhilomathLabLogo';
import { GraduationCap, LogIn, Sparkles, UserCheck, ArrowRight } from 'lucide-react';

interface WebsiteLandingPageProps {
  onAccessPhysicsCourse: (domain?: 'classical' | 'waves' | 'modern') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

export const WebsiteLandingPage: React.FC<WebsiteLandingPageProps> = ({
  onAccessPhysicsCourse,
  isLoggedIn,
  setIsLoggedIn,
}) => {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('Alex Newton');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowLoginModal(false);
    onAccessPhysicsCourse('classical');
  };

  return (
    <div className="min-h-screen bg-deepteal text-cream font-sans flex flex-col selection:bg-gold selection:text-deepteal">
      {/* 1. Top Bar Banner */}
      <div className="bg-gold text-deepteal px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold shadow-xs">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-deepteal shrink-0" />
            <span className="truncate">PHILOMATHLAB ACADEMIC PLATFORM • Interactive Science & Physics Simulation</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <span>Online Portal V2.4</span>
            {isLoggedIn ? (
              <span className="bg-deepteal text-gold px-2.5 py-1 rounded flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Logged In: {studentName}
              </span>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="underline hover:text-deepteal-dark transition-colors px-1 py-0.5"
              >
                Student Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Website Navbar */}
      <header className="bg-deepteal border-b border-sage/20 py-6 sm:py-8 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <PhilomathLabLogo size="lg" variant="light" />
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-8 sm:gap-12 text-base font-sans font-medium text-cream/90">
            <button className="text-gold font-bold border-b-2 border-gold pb-1 px-1">Home</button>
            <button className="hover:text-gold transition-colors px-1 py-0.5">Blog</button>
            <button className="hover:text-gold transition-colors px-1 py-0.5">Book</button>
            <button className="hover:text-gold transition-colors px-1 py-0.5">About</button>
          </nav>

          {/* Login / Portal CTA Button */}
          <div>
            {isLoggedIn ? (
              <button
                onClick={() => onAccessPhysicsCourse('classical')}
                className="flex items-center gap-2 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go to Student Portal</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-gold hover:bg-gold-hover text-deepteal font-mono text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Student Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Course Cards Grid */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          
          {/* Card 1: Python */}
          <div className="bg-gold p-2 rounded-3xl shadow-xl flex flex-col transition-transform hover:-translate-y-1">
            <div className="bg-cream rounded-2xl p-6 flex-1 flex flex-col items-center justify-between min-h-[300px]">
              {/* Illustrative Python SVG Graphics */}
              <div className="w-full aspect-4/3 rounded-xl bg-sage/10 border border-sage/20 p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 300 240" className="w-full h-full">
                  {/* Desk & Computer Setup */}
                  <rect x="40" y="160" width="220" height="10" fill="#DDA853" rx="2" />
                  <rect x="110" y="90" width="80" height="60" fill="#16404D" rx="4" />
                  <rect x="116" y="96" width="68" height="48" fill="#FAF2D2" rx="2" />
                  <rect x="140" y="150" width="20" height="10" fill="#A6CDC6" />
                  {/* Python Code Graphic */}
                  <path d="M 125 110 L 135 120 L 125 130" stroke="#16404D" strokeWidth="3" fill="none" />
                  <text x="142" y="124" fill="#DDA853" fontSize="12" fontFamily="monospace" fontWeight="bold">def sim():</text>
                  {/* Python Logo Swirl */}
                  <circle cx="210" cy="60" r="24" fill="#16404D" opacity="0.1" />
                  <path d="M 200 52 C 200 48, 208 48, 212 48 L 216 48 L 216 56 L 208 56 C 204 56, 204 60, 204 64 L 204 68 L 216 68 L 216 72 L 200 72 Z" fill="#3776AB" />
                  <path d="M 220 68 C 220 72, 212 72, 208 72 L 204 72 L 204 64 L 212 64 C 216 64, 216 60, 216 56 L 216 52 L 204 52 L 204 48 L 220 48 Z" fill="#FFD43B" />
                  {/* Coder Avatar */}
                  <circle cx="80" cy="110" r="16" fill="#16404D" />
                  <path d="M 64 150 C 64 130 96 130 96 150 Z" fill="#DDA853" />
                </svg>
              </div>
            </div>
            <div className="py-4 text-center">
              <h3 className="text-xl font-sans font-extrabold text-deepteal">Python</h3>
            </div>
          </div>

          {/* Card 2: Scratch Starter */}
          <div className="bg-gold p-2 rounded-3xl shadow-xl flex flex-col transition-transform hover:-translate-y-1">
            <div className="bg-cream rounded-2xl p-6 flex-1 flex flex-col items-center justify-between min-h-[300px]">
              {/* Illustrative Scratch Block SVG Graphics */}
              <div className="w-full aspect-4/3 rounded-xl bg-sage/10 border border-sage/20 p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 300 240" className="w-full h-full">
                  {/* Block 1 */}
                  <rect x="80" y="50" width="140" height="30" fill="#4C97FF" rx="6" />
                  <text x="95" y="70" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="bold">move 10 steps</text>
                  {/* Block 2 */}
                  <rect x="80" y="85" width="140" height="30" fill="#9966FF" rx="6" />
                  <text x="95" y="105" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="bold">turn ↻ 15 degrees</text>
                  {/* Block 3 */}
                  <rect x="80" y="120" width="140" height="30" fill="#FFAB19" rx="6" />
                  <text x="95" y="140" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="bold">say "Hello!"</text>
                  {/* Scratch Cat Icon */}
                  <circle cx="210" cy="165" r="22" fill="#FFAB19" />
                  <polygon points="195,150 205,140 210,152" fill="#FFAB19" />
                  <polygon points="225,150 215,140 210,152" fill="#FFAB19" />
                  <circle cx="204" cy="162" r="3" fill="#16404D" />
                  <circle cx="216" cy="162" r="3" fill="#16404D" />
                </svg>
              </div>
            </div>
            <div className="py-4 text-center">
              <h3 className="text-xl font-sans font-extrabold text-deepteal">Scratch Starter</h3>
            </div>
          </div>

          {/* Card 3: Simulation (Physics Course Primary Card) */}
          <div className="bg-gold p-2 rounded-3xl shadow-xl flex flex-col transition-transform hover:-translate-y-1 relative group cursor-pointer" onClick={() => onAccessPhysicsCourse('classical')}>
            <div className="absolute -top-3 right-4 bg-deepteal text-gold text-xs font-mono font-bold px-3 py-1 rounded-full border border-gold z-10 shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> FEATURED COURSE
            </div>
            <div className="bg-cream rounded-2xl p-6 flex-1 flex flex-col items-center justify-between min-h-[300px]">
              {/* Illustrative Simulation Blocks SVG Graphics */}
              <div className="w-full aspect-4/3 rounded-xl bg-sage/10 border border-sage/20 p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 300 240" className="w-full h-full">
                  {/* Physics Simulation Blocks */}
                  <rect x="60" y="100" width="60" height="50" fill="#16404D" rx="6" />
                  <rect x="130" y="60" width="60" height="90" fill="#88C057" rx="6" />
                  <rect x="200" y="110" width="60" height="40" fill="#DDA853" rx="6" />
                  {/* Trajectory Parabola overlay */}
                  <path d="M 40 180 Q 150 20 260 180" stroke="#16404D" strokeWidth="4" strokeDasharray="6 4" fill="none" />
                  <circle cx="150" cy="100" r="8" fill="#DDA853" />
                  {/* Characters assembling physics blocks */}
                  <circle cx="90" cy="70" r="12" fill="#16404D" />
                  <circle cx="230" cy="80" r="12" fill="#16404D" />
                </svg>
              </div>
            </div>
            <div className="py-4 text-center flex flex-col items-center justify-center">
              <h3 className="text-xl font-sans font-extrabold text-deepteal">Simulation</h3>
              <span className="text-xs font-mono font-bold text-deepteal-dark mt-1 flex items-center gap-1 group-hover:underline">
                Access Physics Course Materials <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Student Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-deepteal-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream text-deepteal max-w-md w-full rounded-2xl p-6 shadow-2xl border-2 border-gold relative">
            <div className="flex items-center justify-between border-b border-sage/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-gold-hover" />
                <h3 className="text-lg font-sans font-bold">PhilomathLab Student Portal</h3>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-sage hover:text-deepteal font-bold text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-deepteal-soft mb-4">
              Sign in to access course materials, topics across Classical, Wave & Modern Physics, and python simulation notebooks.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-deepteal mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sage/50 rounded-lg text-sm text-deepteal focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="e.g., Alex Newton"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-deepteal mb-1">
                  Student ID / Access Code
                </label>
                <input
                  type="text"
                  defaultValue="PL-PHYSICS-2026"
                  className="w-full px-3 py-2 bg-white border border-sage/50 rounded-lg text-sm text-deepteal focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold py-2.5 rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Enter Student Course Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-deepteal-dark py-6 border-t border-sage/20 text-center text-xs text-sage-light font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 PhilomathLab. All Rights Reserved.</span>
          <div className="flex items-center gap-4">
            <button onClick={() => onAccessPhysicsCourse('classical')} className="text-gold hover:underline">
              Classical Physics
            </button>
            <button onClick={() => onAccessPhysicsCourse('waves')} className="text-gold hover:underline">
              Waves & Fields
            </button>
            <button onClick={() => onAccessPhysicsCourse('modern')} className="text-gold hover:underline">
              Modern Physics
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
