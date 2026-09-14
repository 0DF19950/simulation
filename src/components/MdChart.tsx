import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Categorical slots, validated on the cream chart surface with the data-viz
 * palette checks (all pairs) — the same hues as the decay lesson's chart.
 * Assigned in this order and never cycled; a total that the others add up to
 * wears the ink instead.
 */
export const MD_SLOTS = ['#A86B12', '#0A8C76', '#8A4E9E'];
export const MD_INK = '#16404D';

const SURFACE = '#FBF5DD';
const GRID = '#E6DCBA';
const AXIS = '#C9BD94';
const TEXT_SECONDARY = '#285A6A';
const EMPTY_RULES: MdRule[] = [];

export interface MdSeries {
  key: string;
  label: string;
  color: string;
  values: ArrayLike<number>;
  dashed?: boolean;
}

/** A labelled reference line: vertical at `x`, or horizontal at `y`. */
export interface MdRule {
  x?: number;
  y?: number;
  label: string;
}

interface MdChartProps {
  /** Increasing x values, shared by every series. */
  x: ArrayLike<number>;
  series: MdSeries[];
  /** Accessible name for the chart. */
  title: string;
  xName: string;
  xUnit: string;
  yName: string;
  yUnit: string;
  /** Values in the tooltip, table and end labels. */
  formatY: (v: number) => string;
  /** Axis ticks; defaults to a trimmed number. */
  formatTick?: (v: number) => string;
  formatX?: (v: number) => string;
  log?: boolean;
  /** A fixed y range; anything outside it is clipped. */
  yDomain?: [number, number];
  /** Index into x to mark with a playhead hairline. */
  playhead?: number;
  /** A marker that moves along the chart, e.g. the current separation on U(r). */
  dot?: { x: number; y: number; color: string } | null;
  rules?: MdRule[];
  endLabels?: boolean;
}

const HEIGHT = 240;
const TOP = 16;
const BOTTOM = 32;
const LEFT = 56;

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
}

const SUPERSCRIPT: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** 10⁻⁶-style text for a power of ten. */
export const powerOfTen = (k: number): string =>
  k === 0 ? '1' : k === 1 ? '10' : `10${[...String(k)].map((c) => SUPERSCRIPT[c] ?? c).join('')}`;

const trim = (v: number) => {
  const s = String(Number(v.toPrecision(6)));
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
};

function nearestIndex(xs: ArrayLike<number>, target: number): number {
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < target) lo = mid;
    else hi = mid;
  }
  return Math.abs(xs[lo] - target) <= Math.abs(xs[hi] - target) ? lo : hi;
}

export const MdChart: React.FC<MdChartProps> = ({
  x: xs,
  series,
  title,
  xName,
  xUnit,
  yName,
  yUnit,
  formatY,
  formatTick = trim,
  formatX = trim,
  log = false,
  yDomain,
  playhead,
  dot,
  rules = EMPTY_RULES,
  endLabels = false,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const clipId = `md-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Measure before the first paint so coordinates are right from the start;
  // the observer keeps them right as the layout changes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (el) setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = xs.length;
  const narrow = width < 480;
  const right = endLabels && !narrow ? 100 : 16;
  const plotW = Math.max(40, width - LEFT - right);
  const plotH = HEIGHT - TOP - BOTTOM;
  const x0 = n ? xs[0] : 0;
  const x1 = n > 1 ? xs[n - 1] : x0 + 1;

  const [lo, hi] = useMemo((): [number, number] => {
    if (yDomain) return yDomain;
    let mn = log ? Infinity : 0;
    let mx = log ? -Infinity : 0;
    for (const s of series) {
      for (let i = 0; i < s.values.length; i++) {
        const v = s.values[i];
        if (!Number.isFinite(v) || (log && v <= 0)) continue;
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
      }
    }
    if (log) return Number.isFinite(mn) ? [10 ** Math.floor(Math.log10(mn)), 10 ** Math.ceil(Math.log10(mx))] : [1e-3, 1];
    if (mx - mn < 1e-9) {
      mn -= 1;
      mx += 1;
    }
    const step = niceStep(mx - mn, 4);
    return [Math.floor(mn / step) * step, Math.ceil(mx / step) * step];
  }, [series, yDomain, log]);

  const px = (v: number) => LEFT + ((v - x0) / (x1 - x0)) * plotW;
  const py = (v: number) => {
    if (log) {
      const l = Math.log10(Math.max(v, lo * 1e-3));
      return TOP + plotH - ((l - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * plotH;
    }
    return TOP + plotH - ((v - lo) / (hi - lo)) * plotH;
  };
  // Keep far-off points near the plot so paths stay sane; the clip path trims them.
  const clampY = (y: number) => Math.max(TOP - 40, Math.min(TOP + plotH + 40, y));

  const paths = useMemo(
    () =>
      series.map((s) => {
        let d = '';
        let pen = false;
        for (let i = 0; i < Math.min(n, s.values.length); i++) {
          const v = s.values[i];
          if (!Number.isFinite(v)) {
            pen = false;
            continue;
          }
          d += `${pen ? 'L' : 'M'}${px(xs[i]).toFixed(1)},${clampY(py(v)).toFixed(1)}`;
          pen = true;
        }
        return d;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, xs, n, lo, hi, log, width, endLabels]
  );

  const yTicks = useMemo(() => {
    const out: number[] = [];
    if (log) {
      const a = Math.round(Math.log10(lo));
      const b = Math.round(Math.log10(hi));
      const every = Math.max(1, Math.ceil((b - a) / 5));
      for (let k = a; k <= b; k += every) out.push(10 ** k);
      return out;
    }
    const step = niceStep(hi - lo, 4);
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }, [lo, hi, log]);

  const xTicks = useMemo(() => {
    const out: number[] = [];
    const step = niceStep(x1 - x0, narrow ? 4 : 7);
    for (let t = Math.ceil(x0 / step - 1e-9) * step; t <= x1 + step * 1e-9; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t);
    return out;
  }, [x0, x1, narrow]);

  // Direct end labels only where they don't collide; the legend and tooltip carry the rest.
  const labelled = useMemo(() => {
    if (!endLabels || narrow || n === 0) return [];
    const ends = series
      .map((s, k) => ({ k, value: s.values[n - 1], y: py(s.values[n - 1]) }))
      .filter((e) => Number.isFinite(e.value) && e.y >= TOP && e.y <= TOP + plotH)
      .sort((a, b) => a.y - b.y);
    const kept: typeof ends = [];
    for (const e of ends) if (!kept.length || e.y - kept[kept.length - 1].y >= 13) kept.push(e);
    return kept;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, n, endLabels, narrow, lo, hi, log]);

  const indexAt = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n < 2) return null;
    const svgX = ((clientX - rect.left) / rect.width) * width;
    return nearestIndex(xs, x0 + ((svgX - LEFT) / plotW) * (x1 - x0));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const jump = Math.max(1, Math.round(n / 100));
    const current = hover ?? playhead ?? n - 1;
    if (e.key === 'ArrowRight') setHover(Math.min(n - 1, current + jump));
    else if (e.key === 'ArrowLeft') setHover(Math.max(0, current - jump));
    else if (e.key === 'Home') setHover(0);
    else if (e.key === 'End') setHover(n - 1);
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

  const tableRows = useMemo(() => {
    const rows: number[] = [];
    if (n === 0) return rows;
    const every = Math.max(1, Math.ceil((n - 1) / 10));
    for (let i = 0; i < n; i += every) rows.push(i);
    if (rows[rows.length - 1] !== n - 1) rows.push(n - 1);
    return rows;
  }, [n]);

  const tickText = (v: number) => (log ? powerOfTen(Math.round(Math.log10(v))) : formatTick(v));
  const inX = (v: number) => v >= Math.min(x0, x1) && v <= Math.max(x0, x1);
  const inY = (v: number) => v >= lo && v <= hi;
  const tooltipLeft = hover === null ? 0 : Math.min(Math.max(((px(xs[hover]) + 10) / width) * 100, 0), 100);

  return (
    <div className="space-y-2">
      {series.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-sans text-deepteal-soft">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <svg width="18" height="4" aria-hidden="true">
                <line x1="0" y1="2" x2="18" y2="2" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} strokeLinecap="round" />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}

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
        {/* Sized by CSS, not a width attribute, so a narrow page never gets pushed sideways. */}
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={title} style={{ display: 'block', width: '100%', height: HEIGHT, background: SURFACE }}>
          <defs>
            <clipPath id={clipId}>
              <rect x={LEFT} y={TOP} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={LEFT} x2={LEFT + plotW} y1={py(v)} y2={py(v)} stroke={v === 0 && !log ? AXIS : GRID} strokeWidth="1" />
              <text x={LEFT - 8} y={py(v) + 3.5} textAnchor="end" fontSize="10" fill={TEXT_SECONDARY} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {tickText(v)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={px(t)} y={TOP + plotH + 16} textAnchor="middle" fontSize="10" fill={TEXT_SECONDARY} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatX(t)}
            </text>
          ))}
          <text x={LEFT + plotW} y={HEIGHT - 3} textAnchor="end" fontSize="10" fill={TEXT_SECONDARY}>
            {xName} ({xUnit})
          </text>
          <text x={12} y={TOP + plotH / 2} fontSize="10" fill={TEXT_SECONDARY} transform={`rotate(-90 12 ${TOP + plotH / 2})`} textAnchor="middle">
            {yName} ({yUnit})
          </text>

          {rules.map((r, k) =>
            r.x !== undefined && inX(r.x) ? (
              <g key={`r${k}`}>
                <line x1={px(r.x)} x2={px(r.x)} y1={TOP} y2={TOP + plotH} stroke={AXIS} strokeWidth="1" />
                {!narrow && (
                  <text x={px(r.x) + 3} y={TOP + 9 + (k % 2) * 11} fontSize="9" fill={TEXT_SECONDARY}>
                    {r.label}
                  </text>
                )}
              </g>
            ) : r.y !== undefined && inY(r.y) ? (
              <g key={`r${k}`}>
                <line x1={LEFT} x2={LEFT + plotW} y1={py(r.y)} y2={py(r.y)} stroke={AXIS} strokeWidth="1" />
                <text x={LEFT + plotW - 4} y={py(r.y) - 4} textAnchor="end" fontSize="9" fill={TEXT_SECONDARY}>
                  {r.label}
                </text>
              </g>
            ) : null
          )}

          <g clipPath={`url(#${clipId})`}>
            {series.map((s, k) => (
              <path
                key={s.key}
                d={paths[k]}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>

          {labelled.map((e) => (
            <g key={`l${e.k}`}>
              <circle cx={px(xs[n - 1])} cy={e.y} r="4" fill={series[e.k].color} stroke={SURFACE} strokeWidth="2" />
              <text x={LEFT + plotW + 9} y={e.y + 3.5} fontSize="10.5" fill={TEXT_SECONDARY}>
                {series[e.k].label} {formatY(e.value)}
              </text>
            </g>
          ))}

          {dot && inX(dot.x) && inY(dot.y) && (
            <circle cx={px(dot.x)} cy={py(dot.y)} r="5" fill={dot.color} stroke={SURFACE} strokeWidth="2" />
          )}
          {playhead !== undefined && playhead > 0 && playhead < n && (
            <line x1={px(xs[playhead])} x2={px(xs[playhead])} y1={TOP} y2={TOP + plotH} stroke="#C59340" strokeWidth="1" />
          )}
          {hover !== null && <line x1={px(xs[hover])} x2={px(xs[hover])} y1={TOP} y2={TOP + plotH} stroke={MD_INK} strokeWidth="1" />}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-sage/70 bg-cream px-3 py-2 shadow-md"
            style={{ left: `min(${tooltipLeft}%, calc(100% - 170px))`, top: TOP }}
          >
            <p className="font-mono text-[10px] text-deepteal-soft mb-1">
              {xName} {formatX(xs[hover])} {xUnit}
            </p>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-[11px] leading-5">
                <span className="inline-block w-3 h-0.5 rounded shrink-0" style={{ background: s.color }} />
                <span className="font-bold text-deepteal" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {Number.isFinite(s.values[hover]) ? formatY(s.values[hover]) : '—'}
                </span>
                <span className="text-deepteal-soft truncate">{s.label}</span>
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
          <table className="w-full text-[11px] border-collapse min-w-[300px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr className="border-b border-sage text-deepteal font-mono text-[10px] uppercase tracking-wide">
                <th className="text-left py-1.5 pr-3">
                  {xName} ({xUnit})
                </th>
                {series.map((s) => (
                  <th key={s.key} className="text-right py-1.5 px-2">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((i) => (
                <tr key={i} className="border-b border-sage/30">
                  <td className="py-1 pr-3 text-deepteal">{formatX(xs[i])}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 px-2 text-right text-deepteal">
                      {Number.isFinite(s.values[i]) ? formatY(s.values[i]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-deepteal-soft mt-1">
            {yName} in {yUnit}.
          </p>
        </div>
      )}
    </div>
  );
};
