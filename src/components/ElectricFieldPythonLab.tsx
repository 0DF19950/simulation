import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Play, RotateCcw, Terminal, XCircle } from 'lucide-react';
import { ElectricFieldCanvas } from './ElectricFieldCanvas';
import {
  PointCharge,
  bisectorFieldExact,
  fieldAt,
  formatField,
  magnitudeOf,
  referenceField,
} from '../utils/electricFieldEngine';

const GRID_RES = 60;
const SIZE = 0.12; // m
const PROBE = { x: 0.06, y: 0.09 };
const ARROW_EVERY = 5;

const DEFAULT_CODE = `# Electric field of point charges, added by superposition.
# Each charge is a dict: x, y in metres (inside a 0.12 m square) and q in coulombs.

K = 8.99e9  # Coulomb's constant, N*m^2/C^2

CHARGES = [
    {"x": 0.04, "y": 0.06, "q": 2e-6},
    {"x": 0.08, "y": 0.06, "q": 2e-6},
    # Try flipping a sign, adding a third charge, or making them unequal.
    # Grounded plate along y = 0.02: for each charge add an image at
    # y = 2*0.02 - y with the opposite sign (the region below is conductor).
]

def field(x, y, charge):
    dx, dy = x - charge["x"], y - charge["y"]
    r = (dx*dx + dy*dy) ** 0.5
    if r < 1e-9:
        return (0.0, 0.0)  # a point charge's own field is undefined at its location
    E = K * charge["q"] / r**2
    return (E * dx / r, E * dy / r)

def total_field(x, y, charges):
    Ex, Ey = 0.0, 0.0
    for c in charges:
        ex, ey = field(x, y, c)
        Ex += ex
        Ey += ey
    return (Ex, Ey)
`;

interface FieldSnapshot {
  magnitude: Float32Array;
  ex: Float32Array;
  ey: Float32Array;
  charges: PointCharge[];
  probeField: { ex: number; ey: number };
}

export const ElectricFieldPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [snapshot, setSnapshot] = useState<FieldSnapshot | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ((window as any).loadPyodide) {
          const py = await (window as any).loadPyodide();
          if (!cancelled) {
            pyodideRef.current = py;
            setIsReady(true);
          }
        }
      } catch (e) {
        console.warn('Pyodide unavailable; the electric field lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async () => {
    setError('');
    setIsRunning(true);

    const py = pyodideRef.current;
    if (!py) {
      setError('Python is still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    const runner = `
import json

${code}

def __run_field():
    GRID_RES = ${GRID_RES}
    W, H = ${SIZE}, ${SIZE}
    ex, ey = [], []
    for j in range(GRID_RES):
        y = (j / (GRID_RES - 1)) * H
        for i in range(GRID_RES):
            x = (i / (GRID_RES - 1)) * W
            fx, fy = total_field(x, y, CHARGES)
            ex.append(float(fx))
            ey.append(float(fy))
    pex, pey = total_field(${PROBE.x}, ${PROBE.y}, CHARGES)
    return json.dumps({
        "ex": ex,
        "ey": ey,
        "charges": [{"x": float(c["x"]), "y": float(c["y"]), "q": float(c["q"])} for c in CHARGES],
        "probe": {"ex": float(pex), "ey": float(pey)},
    })

__run_field()
`;

    try {
      const json = await py.runPythonAsync(runner);
      const parsed = JSON.parse(json);
      if (!parsed.ex?.length) throw new Error('The simulation produced no grid points.');
      const ex = Float32Array.from(parsed.ex as number[]);
      const ey = Float32Array.from(parsed.ey as number[]);
      const magnitude = new Float32Array(ex.length);
      for (let k = 0; k < ex.length; k++) magnitude[k] = Math.hypot(ex[k], ey[k]);
      setSnapshot({ magnitude, ex, ey, charges: parsed.charges, probeField: parsed.probe });
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  // Recompute P from the same CHARGES with the site's own Coulomb's-law engine,
  // so a bug in field() shows up as a disagreement instead of a plausible picture.
  const check = useMemo(() => {
    if (!snapshot) return null;
    const params = { charges: snapshot.charges, plate: null, width: SIZE, height: SIZE };
    const reference = referenceField(params);
    const yours = magnitudeOf(snapshot.probeField);
    const coulomb = magnitudeOf(fieldAt(params, PROBE.x, PROBE.y));
    const scale = Math.max(yours, coulomb, reference * 1e-9);
    return { reference, yours, coulomb, agrees: Math.abs(yours - coulomb) / scale < 1e-6 };
  }, [snapshot]);

  const arrows = useMemo(
    () => (snapshot ? { ex: snapshot.ex, ey: snapshot.ey, every: ARROW_EVERY } : undefined),
    [snapshot]
  );

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — field vectors over a grid</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        Like Lesson 6 there is no loop over time: <code className="font-mono text-xs">total_field(x, y, charges)</code>{' '}
        is evaluated once at every point of a {GRID_RES}×{GRID_RES} grid. The difference is what
        comes back — two numbers, <code className="font-mono text-xs">(Ex, Ey)</code>, because a
        field has a direction as well as a size. Edit <code className="font-mono text-xs">CHARGES</code>{' '}
        for challenges 1–3 and 5; add image charges for challenge 4's plate.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={18}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Electric field superposition function"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={run}
              disabled={isRunning}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-gold text-deepteal font-bold hover:bg-gold-hover transition-colors disabled:opacity-60"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Running' : 'Run simulation'}
            </button>
            <button
              onClick={() => {
                setCode(DEFAULT_CODE);
                setError('');
              }}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset code
            </button>
            {snapshot && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {GRID_RES * GRID_RES} points · real Python
              </span>
            )}
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed overflow-x-auto">{error}</pre>
            </div>
          )}

          {check && !error && (
            <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
              <dt className="text-deepteal-soft">Your total_field at P</dt>
              <dd className="text-deepteal text-right font-bold">{formatField(check.yours, check.reference * 1e-9)} N/C</dd>
              <dt className="text-deepteal-soft">Coulomb's law, same CHARGES</dt>
              <dd className="text-deepteal text-right font-bold">{formatField(check.coulomb, check.reference * 1e-9)} N/C</dd>
              <dt className="text-deepteal-soft">Part 3, starting setup</dt>
              <dd className="text-deepteal text-right font-bold">{formatField(bisectorFieldExact(2e-6, 0.04, 0.03))} N/C</dd>
              <dd className={`col-span-2 flex items-center gap-1.5 pt-1 ${check.agrees ? 'text-sage-dark' : 'text-red-700'}`}>
                {check.agrees ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {check.agrees
                  ? 'Your field() agrees with Coulomb’s law for these charges.'
                  : 'Your field() disagrees with Coulomb’s law — check the powers of r.'}
              </dd>
            </dl>
          )}
        </div>

        <div className="space-y-2">
          {snapshot && check ? (
            <ElectricFieldCanvas
              magnitude={snapshot.magnitude}
              gridRes={GRID_RES}
              referenceField={check.reference}
              width={SIZE}
              height={SIZE}
              charges={snapshot.charges}
              arrows={arrows}
              probe={PROBE}
              probeField={snapshot.probeField}
              label="Electric field computed by your Python code"
            />
          ) : (
            <div className="aspect-square rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to render the field it produces.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            12 × 12 cm region · {GRID_RES}×{GRID_RES} grid · arrows show direction · P = (6 cm, 9 cm)
          </p>
        </div>
      </div>
    </div>
  );
};
