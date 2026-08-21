import React, { useState, useEffect, useRef } from 'react';
import { CELESTIAL_BODIES } from '../data/physicsData';
import { CelestialBody } from '../types';
import { MathFormula, MathText } from './MathFormula';
import { PreLessonQuiz } from './PreLessonQuiz';
import { FallingInstrumentWidget } from './FallingInstrumentWidget';
import {
  Compass, HelpCircle, Globe, Cpu, Sliders,
  Ruler, Gauge, Zap, RefreshCw, Target, Rocket, Lightbulb,
} from 'lucide-react';

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
        {/* Section Header + Instrument Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
          <div className="lg:col-span-7 space-y-4">
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

            <div className="bg-cream-card border border-sage rounded-xl p-5 font-sans text-sm text-deepteal-soft leading-relaxed">
              <p className="mb-2">
                Imagine standing on top of a 50-metre building holding a ball. You let go. The ball falls. Simple enough — until someone asks:
              </p>
              <ul className="list-disc list-inside space-y-0.5 mb-2">
                <li>How long will it take to hit the ground?</li>
                <li>How fast will it be moving when it lands?</li>
                <li>What if you dropped it on the Moon?</li>
                <li>What if there was air resistance?</li>
                <li>What if you dropped it from space?</li>
              </ul>
              <p>Suddenly, the problem gets interesting. That's what this lesson — and eventually simulation — is for.</p>
            </div>
          </div>

          <div className="lg:col-span-5 lg:mt-16">
            <FallingInstrumentWidget />
          </div>
        </div>

        <div className="mb-8">
          <PreLessonQuiz />
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Conceptual Breakdown & Equations */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Part 1: Describing Motion */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal">
                1. Describing motion: three quantities
              </h3>
              <p className="text-sm text-deepteal-soft">
                Physics describes any motion — falling or otherwise — with three related quantities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-cream p-3 rounded-lg border border-sage/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-gold-hover" />
                    <span className="font-sans font-bold text-deepteal">Position</span>
                  </div>
                  <p className="text-deepteal-soft font-sans">Where the object is. Usually written <span className="font-mono">y</span> or <span className="font-mono">x</span>.</p>
                </div>
                <div className="bg-cream p-3 rounded-lg border border-sage/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-gold-hover" />
                    <span className="font-sans font-bold text-deepteal">Velocity</span>
                  </div>
                  <p className="text-deepteal-soft font-sans">How fast position changes. Written <span className="font-mono">v</span>, units m/s.</p>
                </div>
                <div className="bg-cream p-3 rounded-lg border border-sage/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-gold-hover" />
                    <span className="font-sans font-bold text-deepteal">Acceleration</span>
                  </div>
                  <p className="text-deepteal-soft font-sans">How fast velocity changes. Written <span className="font-mono">a</span>, units m/s².</p>
                </div>
              </div>
              <p className="text-xs text-deepteal-soft italic">Acceleration answers: how much does velocity change every second?</p>
            </div>

            {/* Concept Block */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gold-hover" />
                <span>2. The Core Physical Intuition</span>
              </h3>
              <p className="text-sm text-deepteal-soft leading-relaxed">
                When an object drops, it doesn't move at a constant speed — it speeds up continuously. Gravity is not a one-time push; it is a <strong className="text-deepteal font-bold">constant acceleration</strong> (<MathFormula latex="a = -g" />). Every second it falls near Earth, its downward velocity increases by approximately 9.81 m/s.
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs font-mono w-full max-w-xs border-collapse">
                  <thead>
                    <tr className="text-deepteal-soft border-b border-sage">
                      <th className="text-left py-1 pr-4 font-sans font-semibold">Time (s)</th>
                      <th className="text-left py-1 font-sans font-semibold">Velocity (m/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3].map((t) => (
                      <tr key={t} className="border-b border-sage/40">
                        <td className="py-1 pr-4 text-deepteal">{t}</td>
                        <td className="py-1 text-deepteal font-bold">{(t * 9.8).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-deepteal-soft italic">Gravity itself never gets stronger — the object just keeps accumulating speed because gravity keeps acting continuously.</p>
            </div>


            {/* Derivation Steps */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal">
                3. Step-by-Step Derivation of the 2nd-Degree Equation
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

            {/* Solving the equation for time — the missing "how it gets solved" piece */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal">
                Solving it: when does the ball actually land?
              </h3>
              <p className="text-sm text-deepteal-soft">
                So far we've only plugged a time in and read off a height. But the real question from the intro was <em>"how long will it take to hit the ground?"</em> — that means solving for <MathFormula latex="t" />, not evaluating it. Set <MathFormula latex="y(t) = 0" /> and rearrange into standard quadratic form:
              </p>
              <MathFormula latex="\tfrac{1}{2} g t^2 - v_0 t - y_0 = 0" block />
              <p className="text-sm text-deepteal-soft">
                Apply the quadratic formula (<MathFormula latex="a=\tfrac{1}{2}g,\ b=-v_0,\ c=-y_0" />) and keep the positive root, since a negative time doesn't correspond to anything physical:
              </p>
              <MathFormula latex="t = \frac{v_0 + \sqrt{v_0^2 + 2 g y_0}}{g}" block />
              <p className="text-sm text-deepteal-soft">
                With <MathFormula latex="v_0 = 0" /> this simplifies nicely to <MathFormula latex="t = \sqrt{\tfrac{2 y_0}{g}}" />. Plugging in <MathFormula latex="y_0 = 50" /> m and <MathFormula latex="g = 9.8" /> m/s²:
              </p>
              <div className="bg-cream p-3 rounded-lg border border-sage/60 font-mono text-xs text-deepteal space-y-1">
                <div>t = √(2 × 50 / 9.8)</div>
                <div className="font-bold">t ≈ 3.19 s</div>
              </div>
              <p className="text-xs text-deepteal-soft italic">
                Keep that 3.19 s in mind — you'll see the exact same number for Earth in the planet comparison below, computed the same way.
              </p>
            </div>

            {/* Worked example + explicit "not needed yet" callout */}
            <div className="bg-sage-light/50 border border-sage-dark/40 rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal">
                Do we need simulation yet?
              </h3>
              <p className="text-sm text-deepteal-soft">
                Suppose <MathFormula latex="y_0 = 50" /> m and <MathFormula latex="v_0 = 0" />. After two seconds:
              </p>
              <div className="bg-cream p-3 rounded-lg border border-sage/60 font-mono text-xs text-deepteal space-y-1">
                <div>y = 50 − ½(9.8)(2)²</div>
                <div className="font-bold">y = 30.4 m</div>
              </div>
              <p className="text-sm font-sans">
                <strong className="text-deepteal">No.</strong> <span className="text-deepteal-soft">For this problem we already have an exact solution — substitute a value for time, calculate the height directly. Simulation is not necessary here. Scientists reach for simulation only once simpler mathematical methods stop working.</span>
              </p>
            </div>

            {/* Why Do We Simulate Block */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <Cpu className="w-5 h-5 text-gold-hover" />
                <span>4. Why do we simulate if there is an exact formula?</span>
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

              <div className="bg-cream p-3.5 rounded-lg border border-sage/60 text-xs font-sans text-deepteal-soft space-y-2">
                <p>
                  A more realistic drag model: <MathFormula latex="F_d = \frac{1}{2}\rho C_d A v^2" block /> where ρ is air density, C<sub>d</sub> the drag coefficient, A the cross-sectional area, and v the velocity. Doubling speed quadruples drag.
                </p>
                <p>
                  Once drag depends on velocity, the force keeps changing: <span className="font-mono text-deepteal">velocity → drag → acceleration → velocity</span> — a feedback loop that's difficult to solve analytically, but which a simulation handles naturally by updating the system in many small time steps.
                </p>
              </div>
            </div>

            {/* How a simulation thinks */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gold-hover" />
                <span>How a simulation thinks</span>
              </h3>
              <p className="text-sm text-deepteal-soft">
                Instead of solving everything at once, the computer repeats a short loop — the same loop the Python lab below runs every time you hit "Run":
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
                {['Calculate acceleration', 'Update velocity', 'Update position', 'Advance time', 'Repeat'].map((step, i) => (
                  <li key={i} className="bg-cream p-2.5 rounded-lg border border-sage/60 text-center">
                    <span className="block text-gold-hover font-bold mb-1">{i + 1}</span>
                    <span className="text-deepteal-soft font-sans">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-deepteal-soft italic">The motion emerges naturally from these small steps — no closed-form equation required.</p>
            </div>

            {/* From equations to code — the explicit bridge that was missing */}
            <div className="bg-deepteal text-cream rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg flex items-center gap-2">
                <span>From equations to code</span>
              </h3>
              <p className="text-sm text-sage-light font-sans">
                Here's that exact 5-step loop, written as real Python — line for line, the same code the interactive lab below actually runs:
              </p>
              <pre className="bg-deepteal-dark border border-sage/30 rounded-lg p-4 text-xs font-mono text-cream overflow-x-auto leading-relaxed">
{`def acceleration(y, v):
    g = 9.8
    return -g

y, v, t = 50.0, 0.0, 0.0
dt = 0.02

while y > 0:
    a = acceleration(y, v)   # 1. calculate acceleration
    v += a * dt              # 2. update velocity
    y += v * dt              # 3. update position
    t += dt                  # 4. advance time
                              # 5. repeat — that's what "while" does`}
              </pre>
              <p className="text-xs text-sage-light font-sans">
                No quadratic formula anywhere in this code — it never needed one. It just repeats four tiny updates until <span className="font-mono">y</span> reaches the ground, and the correct trajectory falls out of that repetition. That's the whole idea of simulation: trade one hard equation for many easy steps.
              </p>
            </div>

            {/* Real-world applications */}
            <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
                <Rocket className="w-5 h-5 text-gold-hover" />
                <span>Where this shows up</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Spacecraft reentry', 'Skydiving', 'Weather forecasting', 'Sports science', 'Aerospace engineering'].map((app) => (
                  <span key={app} className="text-xs font-mono bg-cream border border-sage rounded-full px-3 py-1 text-deepteal-soft">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Key takeaway */}
            <div className="bg-deepteal text-cream rounded-xl p-5 space-y-2 shadow-xs">
              <h3 className="font-sans font-semibold text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-gold" />
                <span>Key takeaway</span>
              </h3>
              <p className="text-sm text-sage-light font-sans leading-relaxed">
                A falling ball in a vacuum can be solved exactly. A falling object experiencing changing forces, changing gravity, and air resistance quickly becomes difficult to solve analytically — and that's where simulation becomes one of the most powerful tools in science.
              </p>
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

              <div className="flex items-start gap-2 bg-cream p-3 rounded-lg border border-sage/60 text-xs font-sans text-deepteal-soft">
                <Target className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                <span><strong className="text-deepteal">Before you click:</strong> without calculating, which planet gives the fastest impact? The slowest? The largest impact speed? Predict first, then check.</span>
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

