import React, { useState } from 'react';
import { Award, Check, Sparkles, Star, Users, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface MarketingCoursePricingProps {
  onOpenEnrollment: (planName?: string) => void;
}

export const MarketingCoursePricing: React.FC<MarketingCoursePricingProps> = ({ onOpenEnrollment }) => {
  const [billingCycle, setBillingCycle] = useState<'one-time' | 'cohort'>('one-time');

  return (
    <section className="py-16 bg-cream border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-card border border-sage text-deepteal font-mono text-xs font-semibold uppercase">
            <Award className="w-3.5 h-3.5 text-gold-hover" />
            <span>Philomath Lab Course Enrollment</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-deepteal">
            Master Simulation as a Craft — Not an Afterthought
          </h2>

          <p className="text-base text-deepteal-soft font-sans">
            Join the flagship course on <span className="font-semibold text-deepteal">philomathlab.ir / philomathlab.com</span>. Learn the exact interplay of differential equations, numerical algorithms, and Python code.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Plan 1: High School / Foundations */}
          <div className="bg-cream-card border border-sage rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-gold transition-all">
            <div className="space-y-4">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cream border border-sage text-deepteal font-bold uppercase inline-block">
                High School & Beginners
              </span>

              <h3 className="text-2xl font-sans font-bold text-deepteal">
                Kinematics & Python
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-sans font-extrabold text-deepteal">$49</span>
                <span className="text-xs font-mono text-deepteal-soft">/ lifetime access</span>
              </div>

              <p className="text-xs font-sans text-deepteal-soft">
                Perfect for high school students preparing for AP Physics or introductory university mechanics.
              </p>

              <ul className="space-y-2.5 font-mono text-xs text-deepteal-soft pt-2 border-t border-sage">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>12 Guided Physics Modules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Interactive Pygame Canvas Labs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Python Basics & Euler Integrator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Certificate of Completion</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenEnrollment('Kinematics & Python ($49)')}
              className="w-full py-3 bg-cream hover:bg-sage-light/50 text-deepteal font-mono font-bold text-xs rounded-xl border border-sage transition-transform active:scale-98"
            >
              Enroll in Foundations Plan
            </button>
          </div>

          {/* Plan 2: Undergraduate / Core Mastery (POPULAR) */}
          <div className="bg-cream-card text-deepteal border-2 border-gold rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-deepteal font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              ★ Most Popular for Undergrads
            </div>

            <div className="space-y-4 pt-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cream text-deepteal border border-sage font-bold uppercase inline-block">
                Undergraduate / Core Mastery
              </span>

              <h3 className="text-2xl font-sans font-bold text-deepteal">
                Numerical Physics & ODEs
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-sans font-extrabold text-deepteal">$129</span>
                <span className="text-xs font-mono text-deepteal-soft">/ lifetime access</span>
              </div>

              <p className="text-xs font-sans text-deepteal-soft">
                Comprehensive training for physics, engineering, and applied math university students.
              </p>

              <ul className="space-y-2.5 font-mono text-xs text-deepteal-soft pt-2 border-t border-sage">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>28 In-Depth Physics & Math Modules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>RK4 Integrator & Error Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Phase Space & Non-Linear Pendulums</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>1D Wave Equation & Acoustic Models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Direct Instructor QA on philomathlab.ir</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenEnrollment('Numerical Physics & ODEs ($129)')}
              className="w-full py-3 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded-xl shadow-md transition-transform active:scale-98"
            >
              Get Instant Course Access
            </button>
          </div>

          {/* Plan 3: Researcher / Stochastic Accelerator */}
          <div className="bg-cream-card border border-sage rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-gold transition-all">
            <div className="space-y-4">
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cream border border-sage text-deepteal font-bold uppercase inline-block">
                Researchers & Master's
              </span>

              <h3 className="text-2xl font-sans font-bold text-deepteal">
                Stochastic & Quantum Lab
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-sans font-extrabold text-deepteal">$249</span>
                <span className="text-xs font-mono text-deepteal-soft">/ lifetime access</span>
              </div>

              <p className="text-xs font-sans text-deepteal-soft">
                For researchers and graduate scholars building production numerical code for papers and grants.
              </p>

              <ul className="space-y-2.5 font-mono text-xs text-deepteal-soft pt-2 border-t border-sage">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>All High School & Undergrad Modules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>SDEs, Langevin & Monte Carlo Methods</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Quantum Wavepacket & Tunneling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-deepteal shrink-0" />
                  <span>Custom Project Review & Code Audits</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenEnrollment('Stochastic & Quantum Lab ($249)')}
              className="w-full py-3 bg-cream hover:bg-sage-light/50 text-deepteal font-mono font-bold text-xs rounded-xl border border-sage transition-transform active:scale-98"
            >
              Enroll in Researcher Plan
            </button>
          </div>

        </div>

        {/* Student Testimonials Banner */}
        <div className="bg-cream-card rounded-2xl p-6 sm:p-8 border border-sage flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-gold">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <span className="font-mono text-xs text-deepteal font-bold ml-2">4.96/5.0 Student Rating</span>
            </div>

            <p className="text-sm font-sans italic text-deepteal-soft max-w-2xl">
              "In physics class, we were forced to write simulation scripts for research without ever learning numerical methods properly. Philomathlab filled that exact gap — now I understand how step sizes, stiffness, and error accumulation actually work."
            </p>
            <span className="font-mono text-xs text-deepteal-soft block">
              — Physics Undergraduate Student, Philomathlab Community
            </span>
          </div>

          <button
            onClick={() => onOpenEnrollment('General Enrollment Inquiry')}
            className="shrink-0 flex items-center gap-2 py-3 px-5 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            <span>Questions? Contact Founder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
