import React, { useMemo, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { MathFormula } from './MathFormula';

type Method = 'euler' | 'eulercromer' | 'rk4';

const METHOD_LABELS: Record<Method, string> = {
  euler: 'Explicit Euler',
  eulercromer: 'Euler–Cromer',
  rk4: 'RK4',
};

/** Force evaluations per step — the cost side of the accuracy trade-off. */
const FORCE_EVALS: Record<Method, number> = { euler: 1, eulercromer: 1, rk4: 4 };

const DT_VALUES = [1, 0.5, 0.1, 0.01, 0.001];
const H0 = 50;
const G = 9.81;

interface RunResult {
  impactTime: number | null;
  steps: number;
}

const errorOf = (result: RunResult, exact: number) =>
  result.impactTime === null ? Infinity : (Math.abs(result.impactTime - exact) / exact) * 100;

/**
 * Vacuum drop from rest, integrated with the chosen scheme.
 *
 * The ground crossing is found by linear interpolation between the last step
 * above y = 0 and the first at or below it. Without that, detecting impact
 * only at step boundaries would add its own O(dt) error to every method and
 * hide the difference the experiment is meant to expose.
 */
function simulateVacuumDrop(dt: number, method: Method): RunResult {
  let y = H0;
  let v = 0;
  let t = 0;
  let steps = 0;
  const maxSteps = 500_000;
  const accel = () => -G;

  while (steps < maxSteps) {
    const yPrev = y;
    const tPrev = t;

    if (method === 'euler') {
      const a = accel();
      y = y + v * dt; // old velocity
      v = v + a * dt;
    } else if (method === 'eulercromer') {
      const a = accel();
      v = v + a * dt;
      y = y + v * dt; // updated velocity
    } else {
      const k1v = accel();
      const k1y = v;
      const k2v = accel();
      const k2y = v + 0.5 * dt * k1v;
      const k3v = accel();
      const k3y = v + 0.5 * dt * k2v;
      const k4v = accel();
      const k4y = v + dt * k3v;
      v = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      y = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    }

    t += dt;
    steps++;

    if (y <= 0) {
      const frac = yPrev / (yPrev - y);
      return { impactTime: tPrev + frac * dt, steps };
    }
  }

  return { impactTime: null, steps };
}

export const NumericalExperiment: React.FC = () => {
  const [active, setActive] = useState<Method[]>(['euler', 'rk4']);
  const analytical = Math.sqrt((2 * H0) / G);

  const rows = useMemo(
    () =>
      DT_VALUES.map((dt) => ({
        dt,
        results: (['euler', 'eulercromer', 'rk4'] as Method[]).reduce((acc, method) => {
          acc[method] = simulateVacuumDrop(dt, method);
          return acc;
        }, {} as Record<Method, RunResult>),
      })),
    []
  );

  /**
   * The coarsest RK4 step that still beats the finest Euler run — computed, not
   * asserted, so this paragraph can never drift away from the table above it.
   */
  const crossover = useMemo(() => {
    const finestDt = DT_VALUES[DT_VALUES.length - 1];
    const finestEuler = rows[rows.length - 1].results.euler;
    const eulerError = errorOf(finestEuler, analytical);
    const eulerEvals = finestEuler.steps * FORCE_EVALS.euler;

    const winner = rows.find((row) => errorOf(row.results.rk4, analytical) < eulerError);
    if (!winner) return null;

    const rk4Evals = winner.results.rk4.steps * FORCE_EVALS.rk4;
    return {
      finestDt,
      eulerError,
      eulerEvals,
      rk4Dt: winner.dt,
      rk4Error: errorOf(winner.results.rk4, analytical),
      rk4Evals,
      costRatio: eulerEvals / rk4Evals,
    };
  }, [rows, analytical]);

  const toggle = (method: Method) =>
    setActive((prev) =>
      prev.includes(method)
        ? prev.length > 1
          ? prev.filter((m) => m !== method)
          : prev
        : [...prev, method]
    );

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-gold-hover" />
        <span>Numerical experiment: convergence and method</span>
      </h3>

      <p className="text-sm text-deepteal-soft">
        A 50 m vacuum drop from rest, so an exact answer exists to measure against:{' '}
        <MathFormula latex={String.raw`t = \sqrt{2y_0/g} = 3.1927\ \text{s}`} />. Every row solves
        the same physics — only the algorithm and the time step change.
      </p>

      <div className="flex flex-wrap gap-2">
        {(['euler', 'eulercromer', 'rk4'] as Method[]).map((method) => (
          <button
            key={method}
            onClick={() => toggle(method)}
            className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
              active.includes(method)
                ? 'bg-deepteal border-deepteal text-cream font-bold'
                : 'bg-cream border-sage text-deepteal-soft hover:border-gold'
            }`}
          >
            {METHOD_LABELS[method]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse min-w-[420px]">
          <thead>
            <tr className="border-b border-sage text-deepteal">
              <th className="text-left py-2 pr-4 font-bold">Δt (s)</th>
              {active.map((method) => (
                <th key={method} className="text-right py-2 px-3 font-bold" colSpan={2}>
                  {METHOD_LABELS[method]}
                </th>
              ))}
            </tr>
            <tr className="border-b border-sage/50 text-deepteal-soft">
              <th className="py-1 pr-4" />
              {active.map((method) => (
                <React.Fragment key={method}>
                  <th className="text-right py-1 px-3 font-normal text-[10px]">impact</th>
                  <th className="text-right py-1 px-3 font-normal text-[10px]">error</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dt} className="border-b border-sage/30">
                <td className="py-1.5 pr-4 text-deepteal font-bold">{row.dt.toFixed(3)}</td>
                {active.map((method) => {
                  const { impactTime } = row.results[method];
                  const error =
                    impactTime === null
                      ? null
                      : (Math.abs(impactTime - analytical) / analytical) * 100;
                  return (
                    <React.Fragment key={method}>
                      <td className="py-1.5 px-3 text-right text-deepteal">
                        {impactTime === null ? '—' : `${impactTime.toFixed(4)} s`}
                      </td>
                      <td
                        className={`py-1.5 px-3 text-right font-bold ${
                          error === null
                            ? 'text-deepteal-soft'
                            : error < 0.01
                            ? 'text-sage-dark'
                            : error < 1
                            ? 'text-deepteal'
                            : 'text-gold-hover'
                        }`}
                      >
                        {error === null ? '—' : error < 0.0001 ? '<0.0001%' : `${error.toFixed(4)}%`}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-cream border border-sage/60 rounded-lg p-3.5 text-xs text-deepteal-soft space-y-1.5">
        <p className="font-sans">
          <span className="font-bold text-deepteal">Read the Euler column down.</span> Cutting Δt by
          ten cuts the error by roughly ten — the first-order behaviour{' '}
          <MathFormula latex={String.raw`O(\Delta t)`} /> predicted in Part 4.
        </p>
        {crossover && (
          <p className="font-sans">
            <span className="font-bold text-deepteal">Now compare across.</span> RK4 at Δt ={' '}
            {crossover.rk4Dt} reaches {crossover.rk4Error.toFixed(4)}% error using{' '}
            {crossover.rk4Evals.toLocaleString()} force evaluations. Euler at Δt ={' '}
            {crossover.finestDt} only reaches {crossover.eulerError.toFixed(4)}% and spends{' '}
            {crossover.eulerEvals.toLocaleString()} — about {crossover.costRatio.toFixed(0)}× the
            work for more error. RK4 costs {FORCE_EVALS.rk4} evaluations per step against Euler's{' '}
            {FORCE_EVALS.euler}, and still wins decisively. Accuracy per unit of computation, not
            accuracy alone, is what you are choosing between.
          </p>
        )}
        <p className="font-sans italic">
          Honest caveat: gravity is constant here, so RK4 integrates this problem exactly. Its
          residual error is the linear interpolation onto y = 0, not the integrator — a small
          verification lesson in its own right.
        </p>
      </div>
    </div>
  );
};
