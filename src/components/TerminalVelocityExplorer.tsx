import React, { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import { MathFormula } from './MathFormula';

const G = 9.81;

interface DragParams {
  mass: number;
  cd: number;
  area: number;
  rho: number;
}

const SLIDERS: {
  key: keyof DragParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: 'mass', label: 'Mass', symbol: 'm', unit: 'kg', min: 0.1, max: 20, step: 0.1 },
  { key: 'cd', label: 'Drag coefficient', symbol: 'C_d', unit: '', min: 0.05, max: 1.5, step: 0.01 },
  { key: 'area', label: 'Cross-section', symbol: 'A', unit: 'm²', min: 0.01, max: 2, step: 0.01 },
  { key: 'rho', label: 'Air density', symbol: '\\rho', unit: 'kg/m³', min: 0.1, max: 2.5, step: 0.025 },
];

const terminalSpeed = ({ mass, cd, area, rho }: DragParams) =>
  Math.sqrt((2 * mass * G) / (rho * cd * area));

/** Integrate dv/dt = -g - (rho*Cd*A / 2m) v|v| from rest, with RK4. */
function velocityCurve(p: DragParams, duration: number, dt = 0.01): number[] {
  const k = (p.rho * p.cd * p.area) / (2 * p.mass);
  const accel = (v: number) => -G - k * v * Math.abs(v);
  const out: number[] = [];
  let v = 0;
  for (let t = 0; t <= duration; t += dt) {
    out.push(v);
    const k1 = accel(v);
    const k2 = accel(v + 0.5 * dt * k1);
    const k3 = accel(v + 0.5 * dt * k2);
    const k4 = accel(v + dt * k3);
    v += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  }
  return out;
}

export const TerminalVelocityExplorer: React.FC = () => {
  const [params, setParams] = useState<DragParams>({ mass: 1, cd: 0.47, area: 0.05, rho: 1.225 });

  const vt = terminalSpeed(params);
  // Show enough time for the curve to visibly flatten.
  const duration = Math.min(Math.max((3 * vt) / G, 4), 40);

  const { path, vacuumPath, vtY, reached } = useMemo(() => {
    const curve = velocityCurve(params, duration);
    const w = 300;
    const h = 110;
    const vMax = Math.max(vt * 1.15, 1);
    const toPoint = (speed: number, i: number) => {
      const x = (i / (curve.length - 1)) * w;
      const y = (speed / vMax) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };

    // The vacuum line leaves the plot; stop drawing it there. Clamping instead
    // would lay it along the floor and read as a second terminal velocity.
    const vacuumPoints: string[] = [];
    for (let i = 0; i < curve.length; i++) {
      const speed = G * ((i * duration) / (curve.length - 1));
      if (speed > vMax) break;
      vacuumPoints.push(toPoint(speed, i));
    }

    return {
      path: curve.map((v, i) => toPoint(Math.abs(v), i)).join(' '),
      vacuumPath: vacuumPoints.join(' '),
      vtY: (vt / vMax) * h,
      reached: Math.abs(curve[curve.length - 1]) / vt,
    };
  }, [params, duration, vt]);

  const set = (key: keyof DragParams, value: number) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Gauge className="w-5 h-5 text-gold-hover" />
        <span>Terminal velocity explorer</span>
      </h3>

      <p className="text-sm text-deepteal-soft">
        Balance the two forces and the acceleration vanishes. Move each parameter and watch both the
        prediction and the curve respond.
      </p>

      <div className="bg-cream border border-sage/60 rounded-lg p-3 text-center">
        <MathFormula
          latex={String.raw`v_t=\sqrt{\dfrac{2mg}{\rho C_d A}}`}
          block
          className="text-deepteal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">
                  <MathFormula latex={s.symbol} className="text-deepteal font-bold" /> {s.label}
                </span>
                <span className="text-deepteal font-bold">
                  {params[s.key].toFixed(2)} {s.unit}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key]}
                onChange={(e) => set(s.key, parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label={s.label}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="bg-deepteal rounded-lg p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sage-light/70">
              Predicted terminal speed
            </p>
            <p className="font-mono text-3xl font-bold text-gold mt-1">{vt.toFixed(2)}</p>
            <p className="font-mono text-[10px] text-sage-light/70">m/s</p>
          </div>

          <div className="bg-cream border border-sage/60 rounded-lg p-3">
            <svg viewBox="0 0 300 120" className="w-full h-auto" role="img" aria-label="Velocity against time, with and without drag">
              {/* v = 0 baseline and the terminal-velocity asymptote */}
              <line x1="0" y1="1" x2="300" y2="1" stroke="#A6CDC6" strokeWidth="1" />
              <line
                x1="0"
                y1={vtY}
                x2="300"
                y2={vtY}
                stroke="#DDA853"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <polyline points={vacuumPath} fill="none" stroke="#A6CDC6" strokeWidth="1.5" />
              <polyline points={path} fill="none" stroke="#16404D" strokeWidth="2" />
              <text x="3" y="10" fontSize="8" fill="#285A6A" fontFamily="monospace">
                v = 0
              </text>
              <text
                x="3"
                y={Math.min(vtY - 3, 106)}
                fontSize="8"
                fill="#C59340"
                fontFamily="monospace"
              >
                −v_t = {(-vt).toFixed(1)} m/s
              </text>
              <text x="272" y="118" fontSize="8" fill="#285A6A" fontFamily="monospace">
                time
              </text>
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-deepteal-soft mt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-deepteal" /> with drag
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-sage" /> vacuum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-gold" /> v<sub>t</sub>
              </span>
            </div>
            <p className="font-mono text-[10px] text-deepteal-soft mt-1.5">
              After {duration.toFixed(1)} s the object has reached {(reached * 100).toFixed(1)}% of{' '}
              v<sub>t</sub> — approached asymptotically, never exactly attained.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-cream border border-sage/60 rounded-lg p-3.5 text-xs text-deepteal-soft font-sans">
        <span className="font-bold text-deepteal">Two spheres, same shape.</span> With{' '}
        <MathFormula latex={String.raw`A_A = A_B`} /> and identical{' '}
        <MathFormula latex={String.raw`C_d`} />, only mass differs — and{' '}
        <MathFormula latex={String.raw`v_t \propto \sqrt{m}`} />. So{' '}
        <MathFormula latex={String.raw`m_B = 1.00`} /> kg against{' '}
        <MathFormula latex={String.raw`m_A = 0.10`} /> kg gives{' '}
        <MathFormula latex={String.raw`v_{t,B}/v_{t,A} = \sqrt{10} \approx 3.16`} />. Mass does not
        change gravitational acceleration in a vacuum, but it certainly changes a fall through air.
      </div>
    </div>
  );
};
