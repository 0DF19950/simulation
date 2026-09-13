import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Categorical slots for isotopes, validated on the cream chart surface with
 * the data-viz palette checks (all pairs): colour-blind ΔE ≥ 9.6, normal-vision
 * ΔE ≥ 18.3, contrast ≥ 3:1. Assigned in this order and never cycled — a fourth
 * isotope gets the muted ink instead of a generated hue.
 */
export const DECAY_SLOTS = ['#A86B12', '#0A8C76', '#8A4E9E'];
export const DECAY_INK = '#16404D';
export const DECAY_MUTED = '#6F8A86';

const SURFACE = '#FBF5DD';
const GRID = '#E6DCBA';
const AXIS = '#C9BD94';
const TEXT_SECONDARY = '#285A6A';

export interface DecaySeries {
  key: string;
  label: string;
  color: string;
  simulated: ArrayLike<number>;
  /** The exact expectation, drawn dashed in the same colour. */
  expected?: ArrayLike<number>;
}

interface DecayChartProps {
  times: ArrayLike<number>;
  series: DecaySeries[];
  /** Step index to mark with a playhead hairline. */
  playhead?: number;
  /** Faint vertical rules at whole multiples of this half-life. */
  halfLife?: number;
  title: string;
  unit?: string;
}

const HEIGHT = 260;
const TOP = 14;
const BOTTOM = 32;
const LEFT = 58;

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
}

const fmtCount = (v: number) => Math.round(v).toLocaleString('en-US');
const fmtTime = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(2));

export const DecayChart: React.FC<DecayChartProps> = ({ times, series, playhead, halfLife, title, unit = 'days' }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Measure once before the first paint so the coordinates are right from the
  // start; the observer below keeps them right as the layout changes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (el) setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = times.length;
  const tMax = n > 1 ? times[n - 1] : 1;
  const narrow = width < 480;
  const right = narrow ? 14 : 108;
  const plotW = width - LEFT - right;
  const plotH = HEIGHT - TOP - BOTTOM;

  const yMax = useMemo(() => {
    let m = 1;
    for (const s of series) {
      for (let i = 0; i < s.simulated.length; i++) m = Math.max(m, s.simulated[i]);
      if (s.expected) for (let i = 0; i < s.expected.length; i++) m = Math.max(m, s.expected[i]);
    }
    const step = niceStep(m, 4);
    return Math.ceil(m / step) * step;
  }, [series]);

  const x = (t: number) => LEFT + (t / tMax) * plotW;
  const y = (v: number) => TOP + plotH - (v / yMax) * plotH;
  const pathOf = (values: ArrayLike<number>) => {
    let d = '';
    for (let i = 0; i < values.length; i++) d += `${i ? 'L' : 'M'}${x(times[i]).toFixed(1)},${y(values[i]).toFixed(1)}`;
    return d;
  };

  const yStep = niceStep(yMax, 4);
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += yStep) yTicks.push(v);
  const xStep = niceStep(tMax, narrow ? 4 : 8);
  const xTicks: number[] = [];
  for (let t = 0; t <= tMax + 1e-9; t += xStep) xTicks.push(t);
  const halfLifeRules: number[] = [];
  if (halfLife && tMax / halfLife <= 12) for (let k = 1; k * halfLife < tMax; k++) halfLifeRules.push(k * halfLife);

  // Direct end labels only where they don't collide; the legend and tooltip carry the rest.
  const endLabels = useMemo(() => {
    if (narrow || n === 0) return [];
    const ends = series
      .map((s) => ({ key: s.key, label: s.label, value: s.simulated[n - 1], py: y(s.simulated[n - 1]) }))
      .sort((a, b) => a.py - b.py);
    const kept: typeof ends = [];
    for (const e of ends) if (!kept.length || e.py - kept[kept.length - 1].py >= 13) kept.push(e);
    return kept;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, n, narrow, yMax, width]);

  const indexAt = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n < 2) return null;
    const t = ((clientX - rect.left - LEFT) / plotW) * tMax;
    return Math.max(0, Math.min(n - 1, Math.round((t / tMax) * (n - 1))));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = hover ?? playhead ?? n - 1;
    if (e.key === 'ArrowRight') setHover(Math.min(n - 1, current + 1));
    else if (e.key === 'ArrowLeft') setHover(Math.max(0, current - 1));
    else if (e.key === 'Home') setHover(0);
    else if (e.key === 'End') setHover(n - 1);
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

  const tableRows = useMemo(() => {
    const every = Math.max(1, Math.ceil((n - 1) / 10));
    const rows: number[] = [];
    for (let i = 0; i < n; i += every) rows.push(i);
    if (rows[rows.length - 1] !== n - 1) rows.push(n - 1);
    return rows;
  }, [n]);

  const tooltipLeft = hover === null ? 0 : Math.min(Math.max(x(times[hover]) + 10, 0), width - 190);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-sans text-deepteal-soft">
        {series.length > 1 &&
          series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        {series.some((s) => s.expected) && (
          <span className="flex items-center gap-1.5 text-deepteal-soft/80">
            <svg width="22" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="22" y2="2" stroke={TEXT_SECONDARY} strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            exact formula
          </span>
        )}
      </div>

      <div
        ref={wrapRef}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        tabIndex={0}
        role="group"
        aria-label={`${title}. Use the left and right arrow keys to read values.`}
        onPointerMove={(e) => setHover(indexAt(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover((h) => h ?? playhead ?? n - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
        {/* Sized by CSS, not a width attribute: a fixed pixel width counts toward the
            layout's minimum width and would push a narrow page sideways before the
            observer above could shrink it. */}
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={title}
          style={{ display: 'block', width: '100%', height: HEIGHT, background: SURFACE }}
        >
          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={LEFT} x2={LEFT + plotW} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth="1" />
              <text x={LEFT - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill={TEXT_SECONDARY} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtCount(v)}
              </text>
            </g>
          ))}
          {halfLifeRules.map((t, k) => (
            <g key={`h${t}`}>
              <line x1={x(t)} x2={x(t)} y1={TOP} y2={TOP + plotH} stroke={GRID} strokeWidth="1" />
              {!narrow && (
                <text x={x(t) + 3} y={TOP + 9} fontSize="9" fill={TEXT_SECONDARY} opacity="0.75">
                  {k + 1}T½
                </text>
              )}
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={x(t)} y={TOP + plotH + 16} textAnchor="middle" fontSize="10" fill={TEXT_SECONDARY} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtTime(t)}
            </text>
          ))}
          <text x={LEFT + plotW} y={HEIGHT - 3} textAnchor="end" fontSize="10" fill={TEXT_SECONDARY}>
            {unit}
          </text>
          <text x={12} y={TOP + plotH / 2} fontSize="10" fill={TEXT_SECONDARY} transform={`rotate(-90 12 ${TOP + plotH / 2})`} textAnchor="middle">
            atoms
          </text>

          {series.map((s) =>
            s.expected ? (
              <path key={`e${s.key}`} d={pathOf(s.expected)} fill="none" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" opacity="0.85" />
            ) : null
          )}
          {series.map((s) => (
            <path key={`s${s.key}`} d={pathOf(s.simulated)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {series.map((s) => (
            <circle key={`d${s.key}`} cx={x(times[n - 1])} cy={y(s.simulated[n - 1])} r="4" fill={s.color} stroke={SURFACE} strokeWidth="2" />
          ))}
          {endLabels.map((e) => (
            <text key={`l${e.key}`} x={LEFT + plotW + 9} y={e.py + 3.5} fontSize="10.5" fill={TEXT_SECONDARY}>
              {e.label.split(' · ')[0]} {fmtCount(e.value)}
            </text>
          ))}

          {playhead !== undefined && playhead > 0 && playhead < n && (
            <line x1={x(times[playhead])} x2={x(times[playhead])} y1={TOP} y2={TOP + plotH} stroke="#C59340" strokeWidth="1" />
          )}
          {hover !== null && (
            <line x1={x(times[hover])} x2={x(times[hover])} y1={TOP} y2={TOP + plotH} stroke={DECAY_INK} strokeWidth="1" />
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-[170px] rounded-lg border border-sage/70 bg-cream px-3 py-2 shadow-md"
            style={{ left: tooltipLeft, top: TOP }}
          >
            <p className="font-mono text-[10px] text-deepteal-soft mb-1">
              t = {fmtTime(times[hover])} {unit}
            </p>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-[11px] leading-5">
                <span className="inline-block w-3 h-0.5 rounded shrink-0" style={{ background: s.color }} />
                <span className="font-bold text-deepteal" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCount(s.simulated[hover])}
                </span>
                <span className="text-deepteal-soft truncate">{s.label.split(' · ')[0]}</span>
                {s.expected && (
                  <span className="ml-auto text-deepteal-soft/70" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    exact {fmtCount(s.expected[hover])}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowTable((v) => !v)}
        className="font-mono text-[10px] uppercase tracking-wide text-deepteal-soft hover:text-gold-hover transition-colors"
        aria-expanded={showTable}
      >
        {showTable ? 'Hide table' : 'Show as table'}
      </button>
      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse min-w-[320px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr className="border-b border-sage text-deepteal font-mono text-[10px] uppercase tracking-wide">
                <th className="text-left py-1.5 pr-3">t ({unit})</th>
                {series.map((s) => (
                  <th key={s.key} className="text-right py-1.5 px-2" colSpan={s.expected ? 2 : 1}>
                    {s.label.split(' · ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((i) => (
                <tr key={i} className="border-b border-sage/30">
                  <td className="py-1 pr-3 text-deepteal">{fmtTime(times[i])}</td>
                  {series.map((s) => (
                    <React.Fragment key={s.key}>
                      <td className="py-1 px-2 text-right text-deepteal font-bold">{fmtCount(s.simulated[i])}</td>
                      {s.expected && <td className="py-1 px-2 text-right text-deepteal-soft">{fmtCount(s.expected[i])}</td>}
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {series.some((s) => s.expected) && (
            <p className="text-[10px] text-deepteal-soft mt-1">Bold: this run. Plain: the exact formula.</p>
          )}
        </div>
      )}
    </div>
  );
};
