import React, { useState, useEffect, useRef } from 'react';
import { CELESTIAL_BODIES } from '../data/physicsData';
import { CelestialBody } from '../types';
import { MathFormula, MathText } from './MathFormula';
import { Compass, HelpCircle, ArrowDown, Globe, Cpu, CheckCircle2, Sliders } from 'lucide-react';

interface FallingBallLessonProps {
  onLoadIntoLab: (g: number, bodyName: string) => void;
}

export const FallingBallLesson: React.FC<FallingBallLessonProps> = ({ onLoadIntoLab }) => {
  const [selectedBody, setSelectedBody] = useState<CelestialBody>(CELESTIAL_BODIES[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Analytical calculations for 50m drop
  const initialHeight = 50.0;
  const timeToFall = Math.sqrt((2 * initialHeight) / selectedBody.g);
  const impactVelocity = selectedBody.g * timeToFall;

  // Draw the exact quadratic curve for the selected planet
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Canvas background
    ctx.fillStyle = '#FAF2D2';
    ctx.fillRect(0, 0, W, H);

    const pad = { left: 45, right: 20, top: 20, bottom: 35 };
    const graphW = W - pad.left - pad.right;
    const graphH = H - pad.top - pad.bottom;

    // Draw grid background
    ctx.strokeStyle = '#A6CDC6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (i * graphW) / 5;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, H - pad.bottom);
      ctx.stroke();

      const y = pad.top + (i * graphH) / 5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#16404D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.lineTo(W - pad.right, H - pad.bottom);
    ctx.stroke();

    // Plot parabolic trajectory curve y(t) = 50 - 0.5 * g * t^2
    ctx.strokeStyle = '#DDA853';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const numPoints = 60;
    for (let i = 0; i <= numPoints; i++) {
      const tRatio = i / numPoints;
      const t = tRatio * timeToFall;
      const yVal = Math.max(initialHeight - 0.5 * selectedBody.g * t * t, 0);

      const px = pad.left + tRatio * graphW;
      const py = H - pad.bottom - (yVal / initialHeight) * graphH;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#16404D';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('Height (m)', 5, 15);
    ctx.fillText(`t_impact = ${timeToFall.toFixed(2)}s →`, W - 120, H - 10);
  }, [selectedBody, timeToFall]);

  return (
    <section className="py-12 bg-cream border-b border-sage/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-deepteal font-mono text-xs uppercase tracking-wider font-bold mb-2">
            <Compass className="w-4 h-4 text-gold-hover" />
            <span>Exemplar Masterclass Lesson · Level 1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-deepteal">
            What is falling, actually?
          </h2>
          <p className="text-sm sm:text-base text-deepteal-soft font-sans max-w-3xl mt-1">
            Before touching any Python code, let's build absolute physical intuition for free fall, derive its second-degree equation, compare celestial bodies, and understand why we simulate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Conceptual Breakdown & Equations */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Concept Block */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gold-hover" />
                <span>1. The Core Physical Intuition</span>
              </h3>
              <p className="text-sm text-deepteal-soft leading-relaxed">
                When an object drops, it doesn't move at a constant speed — it speeds up continuously. Gravity is not a one-time push; it is a <strong className="text-deepteal font-bold">constant acceleration</strong> (<MathFormula latex="a = -g" />). Every second it falls near Earth, its downward velocity increases by approximately 9.81 m/s.
              </p>
            </div>

            {/* Derivation Steps */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal">
                2. Step-by-Step Derivation of the 2nd-Degree Equation
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 bg-cream p-3 rounded-lg border border-sage/60">
                  <span className="font-mono text-xs font-bold w-6 h-6 rounded-full bg-gold text-deepteal flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    1
                  </span>
                  <div>
                    <span className="font-sans font-semibold text-deepteal block">Constant Acceleration</span>
                    <p className="text-deepteal-soft text-xs mb-1">Gravity pulls downward with fixed rate <em>g</em>:</p>
                    <MathFormula latex="a = -g" block />
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-cream p-3 rounded-lg border border-sage/60">
                  <span className="font-mono text-xs font-bold w-6 h-6 rounded-full bg-gold text-deepteal flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    2
                  </span>
                  <div>
                    <span className="font-sans font-semibold text-deepteal block">Velocity Accumulation</span>
                    <p className="text-deepteal-soft text-xs mb-1">Integrating acceleration over time <em>t</em> gives linear velocity:</p>
                    <MathFormula latex="v(t) = v_0 - g \cdot t" block />
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-cream p-3 rounded-lg border border-sage/60">
                  <span className="font-mono text-xs font-bold w-6 h-6 rounded-full bg-gold text-deepteal flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    3
                  </span>
                  <div>
                    <span className="font-sans font-semibold text-deepteal block">Displacement (Quadratic Equation)</span>
                    <p className="text-deepteal-soft text-xs mb-1">Integrating velocity gives the quadratic height equation:</p>
                    <MathFormula latex="y(t) = y_0 + v_0 t - \frac{1}{2} g t^2" block />
                  </div>
                </div>
              </div>
            </div>

            {/* Why Do We Simulate Block */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <Cpu className="w-5 h-5 text-gold-hover" />
                <span>3. Why do we simulate if there is an exact formula?</span>
              </h3>
              <p className="text-sm text-deepteal-soft">
                The formula <MathFormula latex="y(t) = y_0 + v_0 t - \frac{1}{2}gt^2" /> only works in an ideal vacuum with constant gravity. Real physical engineering breaks these assumptions:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="bg-cream p-2.5 rounded-lg border border-sage">
                  <span className="text-deepteal font-bold block mb-1">💨 Air Resistance</span>
                  <span className="text-deepteal-soft font-sans">
                    Drag force <MathFormula latex="F_d \propto -v|v|" /> prevents closed-form height equations.
                  </span>
                </div>

                <div className="bg-cream p-2.5 rounded-lg border border-sage">
                  <span className="text-deepteal font-bold block mb-1">🌍 Variable g(y)</span>
                  <span className="text-deepteal-soft font-sans">
                    <MathFormula latex="g(y) = \frac{GM}{(R+y)^2}" /> weakens as altitude increases.
                  </span>
                </div>

                <div className="bg-cream p-2.5 rounded-lg border border-sage">
                  <span className="text-deepteal font-bold block mb-1">🌌 Multi-Body</span>
                  <span className="text-deepteal-soft font-sans">
                    N-body gravitational pull leads to deterministic chaos.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Celestial Body Selector & Real-Time Trajectory */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-cream-card text-deepteal border border-sage rounded-xl p-5 shadow-lg space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gold-hover" />
                  <h3 className="font-sans font-bold text-base text-deepteal">
                    Same Equation, Different Planets
                  </h3>
                </div>
                <span className="text-xs font-mono text-deepteal-soft font-bold">
                  50m Free Fall
                </span>
              </div>

              {/* Celestial Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {CELESTIAL_BODIES.map((body) => (
                  <button
                    key={body.id}
                    onClick={() => setSelectedBody(body)}
                    className={`flex items-center gap-1.5 p-2 rounded border font-mono text-xs transition-all ${
                      selectedBody.id === body.id
                        ? 'bg-gold text-deepteal border-gold font-bold shadow-xs'
                        : 'bg-cream text-deepteal-soft border-sage hover:border-gold hover:text-deepteal'
                    }`}
                  >
                    <span>{body.icon}</span>
                    <span className="truncate">{body.name}</span>
                  </button>
                ))}
              </div>

              {/* Selected Body Telemetry Card */}
              <div className="bg-cream p-4 rounded-lg border border-sage space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-sage/60 pb-1.5">
                  <span className="text-deepteal-soft">Surface Gravity (g):</span>
                  <span className="font-bold text-deepteal">{selectedBody.g} m/s²</span>
                </div>

                <div className="flex justify-between border-b border-sage/60 pb-1.5">
                  <span className="text-deepteal-soft">Time to fall 50 meters:</span>
                  <span className="font-bold text-deepteal">{timeToFall.toFixed(2)} seconds</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-deepteal-soft">Impact Velocity:</span>
                  <span className="font-bold text-deepteal">{impactVelocity.toFixed(1)} m/s ({(impactVelocity * 3.6).toFixed(0)} km/h)</span>
                </div>
              </div>

              {/* Canvas Plot */}
              <div className="space-y-1">
                <MathText
                  className="text-xs font-mono text-deepteal-soft block"
                  text="Trajectory Curve $y(t) = 50 - \frac{1}{2}g t^2$:"
                />
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={220}
                  className="bg-cream rounded-lg border border-sage w-full"
                />
              </div>

              {/* Action Button: Load into Python Lab */}
              <button
                onClick={() => onLoadIntoLab(selectedBody.g, selectedBody.name)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gold hover:bg-gold-hover text-deepteal font-mono font-bold text-xs rounded transition-transform active:scale-98 shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                <span>LOAD {selectedBody.name.toUpperCase()} ({selectedBody.g} m/s²) INTO PYTHON LAB ↓</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

