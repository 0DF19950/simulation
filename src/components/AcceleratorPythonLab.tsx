import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Play, RotateCcw, Terminal, XCircle } from 'lucide-react';
import { AcceleratorCanvas, BeamFrames } from './AcceleratorCanvas';

const LAPS = 6;
const STEPS_PER_LAP = 150;
const RECORD_EVERY = 2;

const DEFAULT_CODE = `# Charged particles in a uniform magnetic field, pushed step by step.
# You supply the physics; the lab advances every particle with the Boris pusher.

q = 1.6e-19      # charge, C (a proton)
m = 1.67e-27     # mass, kg
B = 0.5          # field strength, T, pointing out of the screen
v0 = 3e6         # injection speed, m/s

K = 8.99e9       # Coulomb's constant, N*m^2/C^2
WEIGHT = 1       # real particles per simulated dot; try 25e6 with two or more dots

r = m * v0 / (q * B)          # Part 3's radius, used to place the particles

# Each particle is [x, y, vx, vy]. For challenge 2 add [0.0, r - 0.006, v0, 0.0];
# for challenge 3, add a small cloud of them.
PARTICLES = [
    [0.0, r, v0, 0.0],
]

def electric_field(x, y, others):
    """Field at (x, y) from the other dots (space charge), as (Ex, Ey) in V/m."""
    Ex, Ey = 0.0, 0.0
    for ox, oy in others:
        dx, dy = x - ox, y - oy
        r2 = dx*dx + dy*dy + 0.0005**2      # softened, so close passes stay finite
        f = K * q * WEIGHT / r2**1.5
        Ex += f * dx
        Ey += f * dy
    return (Ex, Ey)
`;

interface LabResult {
  beam: BeamFrames;
  measuredRadius: number;
  formulaRadius: number;
}

export const AcceleratorPythonLab: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState<LabResult | null>(null);
  const [frame, setFrame] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const pyodideRef = useRef<any>(null);
  const rafRef = useRef<number>(0);

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
        console.warn('Pyodide unavailable; the accelerator lab needs it to run.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    const total = result.beam.nFrames;
    const perFrame = Math.max(1, Math.round(total / 360));
    const tick = () => {
      setFrame((f) => (f + perFrame >= total ? 0 : f + perFrame));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [result]);

  const run = async () => {
    setError('');
    setIsRunning(true);

    const py = pyodideRef.current;
    if (!py) {
      setError('Python is still loading in the background — try again in a moment.');
      setIsRunning(false);
      return;
    }

    // The lab owns the push (Boris, exactly as the simulator above uses); the
    // learner owns the physics: charges, field, and where the particles start.
    const runner = `
import json, math

${code}

def __run_beam():
    LAPS, STEPS, RECORD = ${LAPS}, ${STEPS_PER_LAP}, ${RECORD_EVERY}
    T = 2 * math.pi * m / (abs(q) * B)
    dt = T / STEPS
    qm = q / m
    ps = [list(map(float, p)) for p in PARTICLES]
    if not ps:
        raise ValueError("PARTICLES is empty - add at least one particle.")
    frames, first_lap = [], []
    for step in range(LAPS * STEPS):
        if step % RECORD == 0:
            frames.append([[p[0], p[1]] for p in ps])
        fields = []
        for i, p in enumerate(ps):
            others = [(o[0], o[1]) for j, o in enumerate(ps) if j != i]
            fields.append(electric_field(p[0], p[1], others))
        for p, (Ex, Ey) in zip(ps, fields):
            h = qm * dt / 2
            vxm, vym = p[2] + h * Ex, p[3] + h * Ey
            tz = h * B
            sz = 2 * tz / (1 + tz * tz)
            vpx, vpy = vxm + vym * tz, vym - vxm * tz
            p[2] = vxm + vpy * sz + h * Ex
            p[3] = vym - vpx * sz + h * Ey
            p[0] += p[2] * dt
            p[1] += p[3] * dt
        if step < STEPS:
            first_lap.append((ps[0][0], ps[0][1]))
    frames.append([[p[0], p[1]] for p in ps])
    cx = sum(x for x, _ in first_lap) / len(first_lap)
    cy = sum(y for _, y in first_lap) / len(first_lap)
    measured = sum(math.hypot(x - cx, y - cy) for x, y in first_lap) / len(first_lap)
    speed0 = math.hypot(PARTICLES[0][2], PARTICLES[0][3])
    return json.dumps({
        "frames": frames,
        "charge": 1 if q > 0 else -1,
        "measuredRadius": measured,
        "formulaRadius": m * speed0 / (abs(q) * B),
    })

__run_beam()
`;

    try {
      // A fresh namespace for every run. Pyodide otherwise keeps one global
      // namespace for the whole page, so a function renamed or deleted in the
      // editor would keep running from the previous run, and the results would
      // describe code that is no longer there.
      const namespace = py.globals.get('dict')();
      let json: string;
      try {
        json = await py.runPythonAsync(runner, { globals: namespace });
      } finally {
        namespace.destroy();
      }
      const parsed = JSON.parse(json);
      const frames: number[][][] = parsed.frames;
      const n = frames[0]?.length ?? 0;
      if (n === 0) throw new Error('The simulation produced no particles.');
      const positions = new Float32Array(frames.length * n * 2);
      let maxExtent = 0;
      frames.forEach((particles, f) =>
        particles.forEach(([x, y], i) => {
          positions[(f * n + i) * 2] = x;
          positions[(f * n + i) * 2 + 1] = y;
          maxExtent = Math.max(maxExtent, Math.hypot(x, y));
        })
      );
      setFrame(0);
      setResult({
        beam: { nParticles: n, nFrames: frames.length, positions, chargeSign: parsed.charge, maxExtent },
        measuredRadius: parsed.measuredRadius,
        formulaRadius: parsed.formulaRadius,
      });
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsRunning(false);
    }
  };

  const gap = result ? Math.abs(result.measuredRadius - result.formulaRadius) / result.formulaRadius : 0;
  const matches = gap < 0.005;

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gold-hover" />
          <span>Python lab — a beam, step by step</span>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft">
          {isReady ? 'Pyodide ready' : 'Loading Python…'}
        </span>
      </div>

      <p className="text-sm text-deepteal-soft">
        This lab splits the work the way real beam codes do. You write the physics — the charge, the
        field, <code className="font-mono text-xs">electric_field(x, y, others)</code> for the push from
        other dots, and where <code className="font-mono text-xs">PARTICLES</code> start. The lab does
        the push itself, with the same Boris scheme as the simulator, for {LAPS} laps at{' '}
        {STEPS_PER_LAP} steps per lap. Challenges 1–3 happen here; the RF cavity and radiation live in
        the simulator above.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={20}
            className="w-full font-mono text-[11px] leading-relaxed bg-deepteal-dark text-sage-light rounded-lg p-3.5 border border-sage/30 focus:border-gold focus:outline-none resize-y"
            aria-label="Beam physics code"
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
            {result && !error && (
              <span className="font-mono text-[10px] text-deepteal-soft ml-auto">
                {result.beam.nParticles} particle{result.beam.nParticles === 1 ? '' : 's'} · real Python
              </span>
            )}
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono text-[10px] whitespace-pre-wrap leading-relaxed overflow-x-auto">{error}</pre>
            </div>
          )}

          {result && !error && (
            <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
              <dt className="text-deepteal-soft">Measured radius, lap 1</dt>
              <dd className="text-deepteal text-right font-bold">{(result.measuredRadius * 100).toFixed(3)} cm</dd>
              <dt className="text-deepteal-soft">r = mv/(qB)</dt>
              <dd className="text-deepteal text-right font-bold">{(result.formulaRadius * 100).toFixed(3)} cm</dd>
              <dd className={`col-span-2 flex items-center gap-1.5 pt-1 ${matches ? 'text-sage-dark' : 'text-deepteal'}`}>
                {matches ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                {matches
                  ? `Within ${(gap * 100).toFixed(3)}% of Part 3's formula.`
                  : `${(gap * 100).toFixed(1)}% off the formula — expected once other dots push on the first one.`}
              </dd>
            </dl>
          )}
        </div>

        <div className="space-y-2">
          {result ? (
            <AcceleratorCanvas
              run={result.beam}
              frame={frame}
              trailFrames={result.beam.nParticles > 2 ? 60 : undefined}
              formulaRadius={result.formulaRadius}
              label="Beam computed by your Python code"
            />
          ) : (
            <div className="aspect-square rounded-lg border border-dashed border-sage bg-cream flex items-center justify-center p-6">
              <p className="font-mono text-[11px] text-deepteal-soft text-center">
                Run the code to watch the particles it describes.
              </p>
            </div>
          )}
          <p className="font-mono text-[10px] text-deepteal-soft">
            {LAPS} laps · {STEPS_PER_LAP} steps per lap · dashed circle = r = mv/(qB)
          </p>
        </div>
      </div>
    </div>
  );
};
