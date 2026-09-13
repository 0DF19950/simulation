import React from 'react';

// Decorative hero art: math, physics and code motifs wired together like a
// circuit — the tagline's "taught together", drawn. Colours are the index.css
// palette so the piece sits directly on the cream hero.
const LINE = '#7CA7A0'; // sage-dark
const INK = '#285A6A'; // deepteal-soft, used at reduced opacity
const TEAL = '#A6CDC6'; // sage
const PALE = '#D4E8E4'; // sage-light
const GOLD = '#DDA853';
const PAPER = '#FBF5DD'; // cream — fills that should hide wiring behind them

const SANS = "'Space Grotesk', system-ui, sans-serif";

// One period of sin(θ) inside the left circle.
const SINE = { x0: 147, x1: 237, axisY: 270, amp: 33 };
const sineY = (x: number) =>
  SINE.axisY - SINE.amp * Math.sin((2 * Math.PI * (x - SINE.x0)) / (SINE.x1 - SINE.x0));
const sinePoints = (from: number, to: number, n = 24) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = from + ((to - from) * i) / n;
    return `${x.toFixed(1)},${sineY(x).toFixed(1)}`;
  });
const SINE_MID = (SINE.x0 + SINE.x1) / 2;
const SINE_PATH = `M ${sinePoints(SINE.x0, SINE.x1, 48).join(' L ')}`;
const LOBE_UP = `M ${SINE.x0},${SINE.axisY} L ${sinePoints(SINE.x0, SINE_MID).join(' L ')} Z`;
const LOBE_DOWN = `M ${SINE_MID},${SINE.axisY} L ${sinePoints(SINE_MID, SINE.x1).join(' L ')} Z`;

const STAR = { cx: 317, cy: 141 };
const RAYS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * Math.PI) / 12;
  const [r0, r1] = i % 2 ? [29, 47] : [24, 55];
  return {
    x1: STAR.cx + r0 * Math.cos(a),
    y1: STAR.cy + r0 * Math.sin(a),
    x2: STAR.cx + r1 * Math.cos(a),
    y2: STAR.cy + r1 * Math.sin(a),
  };
});

const HEX_POINTS = Array.from({ length: 6 }, (_, i) => {
  const a = ((-90 + 60 * i) * Math.PI) / 180;
  return `${(444 + 77 * Math.cos(a)).toFixed(1)},${(270 + 77 * Math.sin(a)).toFixed(1)}`;
}).join(' ');

const GRID_DOTS = Array.from({ length: 36 }, (_, i) => ({
  cx: 463 + (i % 6) * 9.2,
  cy: 358 + Math.floor(i / 6) * 11.5,
  opacity: [0.16, 0.32, 0.5][(i * 7 + Math.floor(i / 6)) % 3],
}));

const CLUSTER_DOTS = [
  [150, 158], [160, 158],
  [140, 169], [150, 169], [160, 169],
  [130, 180], [140, 180], [150, 180], [160, 180],
];

const wire = { stroke: INK, strokeOpacity: 0.4, strokeWidth: 1.4, strokeLinecap: 'round' as const };
const node = { fill: PAPER, stroke: INK, strokeOpacity: 0.55, strokeWidth: 1.6 };

export const HeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 640 520"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* Wiring first, so every shape below sits on top of it */}
    <g {...wire}>
      <line x1="247" y1="69" x2="396" y2="222" />
      <line x1="387" y1="69" x2="240" y2="221" />
      <line x1="317" y1="55" x2="317" y2="236" />
      <line x1="116" y1="141" x2="299" y2="141" />
      <line x1="187" y1="74" x2="187" y2="201" />
      <line x1="187" y1="339" x2="187" y2="394" />
      <line x1="90" y1="167" x2="90" y2="264" />
      <line x1="64" y1="270" x2="84" y2="270" />
      <line x1="96" y1="270" x2="122" y2="270" />
      <line x1="261" y1="270" x2="292" y2="270" />
      <line x1="317" y1="302" x2="317" y2="386" />
      <line x1="240" y1="321" x2="287" y2="368" />
      <line x1="397" y1="320" x2="347" y2="368" />
      <line x1="444" y1="141" x2="444" y2="193" />
      <line x1="317" y1="408" x2="317" y2="474" />
      <line x1="511" y1="270" x2="550" y2="270" />
      <line x1="562" y1="270" x2="590" y2="270" />
      <path d="M 90 276 V 380 Q 90 394 104 394 H 306" />
      <path d="M 76 270 V 392 Q 76 406 90 406 H 310" />
      <path d="M 335 141 H 514 Q 528 141 528 155 V 240" />
      <path d="M 392 113 H 542 Q 556 113 556 127 V 264" />
      <path d="M 554 339 V 378 Q 554 391 544 391" />
    </g>
    <g stroke={TEAL} strokeWidth={1.6} strokeLinecap="round">
      <path d="M 62 292 V 406 Q 62 420 76 420 H 244" />
      <path d="M 390 127 H 528 Q 542 127 542 141 V 253" />
      <line x1="346" y1="270" x2="377" y2="270" />
    </g>

    {/* Line stacks */}
    <g strokeWidth={1.6} strokeLinecap="round">
      <line x1="26" y1="212" x2="112" y2="212" stroke={LINE} />
      <line x1="26" y1="222" x2="112" y2="222" stroke={INK} strokeOpacity={0.45} />
      <line x1="26" y1="232" x2="112" y2="232" stroke={TEAL} />
      <line x1="26" y1="242" x2="112" y2="242" stroke={INK} strokeOpacity={0.45} />
      <line x1="26" y1="252" x2="96" y2="252" stroke={PALE} strokeWidth={2.2} />
      <line x1="527" y1="290" x2="606" y2="290" stroke={TEAL} />
      <line x1="527" y1="300" x2="606" y2="300" stroke={LINE} />
      <line x1="527" y1="310" x2="606" y2="310" stroke={INK} strokeOpacity={0.45} />
      <line x1="527" y1="320" x2="606" y2="320" stroke={LINE} />
      <line x1="527" y1="330" x2="590" y2="330" stroke={LINE} strokeOpacity={0.55} />
    </g>

    {/* Dots */}
    <g fill={INK} fillOpacity={0.35}>
      {[131, 140, 149, 158, 167].flatMap((x) =>
        [113, 122].map((y) => <circle key={`r${x}-${y}`} cx={x} cy={y} r={1.7} />)
      )}
      {CLUSTER_DOTS.map(([x, y]) => (
        <circle key={`c${x}-${y}`} cx={x} cy={y} r={2} />
      ))}
    </g>
    <g fill={INK}>
      {GRID_DOTS.map((d) => (
        <circle key={`g${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r={1.7} fillOpacity={d.opacity} />
      ))}
    </g>
    <g fill={LINE} fillOpacity={0.45}>
      {[292, 309, 326, 343].map((y) => (
        <circle key={`l${y}`} cx={40} cy={y} r={2.8} />
      ))}
      {[201, 218, 235, 252].map((y) => (
        <circle key={`rr${y}`} cx={572} cy={y} r={2.8} />
      ))}
    </g>
    <g fill={LINE} fillOpacity={0.75}>
      {[26, 34, 42].map((x) => (
        <circle key={`in${x}`} cx={x} cy={270} r={1.6} />
      ))}
      {[404, 415, 426, 437, 448].flatMap((x) =>
        [90, 101].map((y) => <circle key={`t${x}-${y}`} cx={x} cy={y} r={1.8} />)
      )}
      {[186, 197, 208, 219].flatMap((x) =>
        [430, 441].map((y) => <circle key={`b${x}-${y}`} cx={x} cy={y} r={1.8} />)
      )}
    </g>

    {/* Arrowheads */}
    <g fill={LINE}>
      <path d="M 50 262 L 64 270 L 50 278 Z" />
      <path d="M 590 262 L 606 270 L 590 278 Z" />
      <path d="M 458 88 L 472 95.5 L 458 103 Z" />
      <path d="M 229 428 L 243 435.5 L 229 443 Z" />
    </g>
    <g fill={INK}>
      <path d="M 124 357 L 137 364 L 124 371 Z" fillOpacity={0.14} />
      <path d="M 140 357 L 153 364 L 140 371 Z" fillOpacity={0.28} />
      <path d="M 156 357 L 169 364 L 156 371 Z" fillOpacity={0.5} />
      <path
        d="M 208 364 C 214 356 226 356 232 364 C 226 372 214 372 208 364 Z M 226 359 L 234 352 L 231 361 Z M 226 369 L 234 376 L 231 367 Z"
        fillOpacity={0.26}
      />
    </g>
    <line x1="220" y1="104" x2="220" y2="128" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
    <path d="M 211 106 L 220 90 L 229 106 Z" fill={TEAL} />
    <line x1="444" y1="347" x2="444" y2="448" stroke={LINE} strokeWidth={1.6} />
    <path d="M 436 448 L 452 448 L 444 462 Z" fill={TEAL} />

    {/* Nodes */}
    <circle cx="187" cy="68" r="6" {...node} />
    <circle cx="90" cy="270" r="6" {...node} />
    <circle cx="556" cy="270" r="6" {...node} />
    <circle cx="317" cy="480" r="6" {...node} />
    <circle cx="90" cy="141" r="26" fill={PALE} fillOpacity={0.7} stroke={INK} strokeOpacity={0.22} strokeWidth={1.4} />
    <circle cx="90" cy="141" r="8" fill={TEAL} stroke={INK} strokeOpacity={0.55} strokeWidth={1.8} />
    <circle cx="531" cy="391" r="13" fill={PALE} fillOpacity={0.85} stroke={INK} strokeOpacity={0.22} strokeWidth={1.4} />
    <circle cx="531" cy="391" r="5" fill={LINE} />

    {/* Addition */}
    <circle cx="220" cy="171" r="18" fill={TEAL} fillOpacity={0.75} />
    <path d="M 212 171 H 228 M 220 163 V 179" stroke={INK} strokeOpacity={0.7} strokeWidth={2.4} strokeLinecap="round" />

    {/* Starburst */}
    <circle cx={STAR.cx} cy={STAR.cy} r="63" stroke={LINE} strokeWidth={1.8} />
    <g stroke={LINE} strokeOpacity={0.8} strokeWidth={1.2} strokeLinecap="round">
      {RAYS.map((r, i) => (
        <line key={`ray${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
      ))}
    </g>
    <circle cx={STAR.cx} cy={STAR.cy} r="18" fill={PAPER} stroke={LINE} strokeWidth={2.2} />
    <circle cx={STAR.cx} cy={STAR.cy} r="10" fill={GOLD} />

    {/* sin(θ) */}
    <circle cx="191" cy="270" r="69" fill={PAPER} stroke={LINE} strokeWidth={1.8} />
    <path d={LOBE_UP} fill={PALE} />
    <path d={LOBE_DOWN} fill={PALE} />
    <g stroke={INK} strokeOpacity={0.5} strokeWidth={1.4} strokeLinecap="round">
      <line x1="147" y1="226" x2="147" y2="314" />
      <line x1="137" y1="270" x2="248" y2="270" />
      <line x1="169.5" y1="237" x2="169.5" y2="270" />
      <line x1="214.5" y1="270" x2="214.5" y2="303" />
    </g>
    <path d={SINE_PATH} stroke={LINE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <text x="222" y="252" textAnchor="middle" fontSize="15" fill={INK} fillOpacity={0.75} fontFamily={SANS}>
      sin(θ)
    </text>

    {/* Σ */}
    <path
      d="M 339 252 V 243 H 296 L 319 270 L 296 297 H 339 V 288"
      stroke={INK}
      strokeOpacity={0.72}
      strokeWidth={7}
      strokeLinejoin="miter"
    />

    {/* d/dx and ∂ */}
    <g fill={INK} fillOpacity={0.72} fontFamily={SANS} fontSize="19" textAnchor="middle">
      <text x="406" y="167">d</text>
      <text x="406" y="194">dx</text>
    </g>
    <line x1="392" y1="174" x2="420" y2="174" stroke={INK} strokeOpacity={0.72} strokeWidth={1.8} />
    <text
      x="488"
      y="190"
      textAnchor="middle"
      fontSize="42"
      fill={INK}
      fillOpacity={0.72}
      fontFamily="'Source Serif 4', Georgia, serif"
    >
      ∂
    </text>

    {/* { } */}
    <polygon points={HEX_POINTS} fill={PAPER} stroke={LINE} strokeWidth={1.8} strokeLinejoin="round" />
    <g fill={LINE} fontFamily={SANS} fontSize="68" textAnchor="middle">
      <text x="424" y="293">{'{'}</text>
      <text x="464" y="293">{'}'}</text>
    </g>

    {/* ∫ */}
    <path
      d="M 428 366 C 427 356 415 354 414 368 L 410 412 C 409 426 397 428 396 418"
      stroke={INK}
      strokeOpacity={0.7}
      strokeWidth={5}
      strokeLinecap="round"
    />

    {/* Orbit */}
    <circle cx="317" cy="397" r="65" stroke={TEAL} strokeWidth={1.6} />
    <circle cx="317" cy="397" r="42" stroke={LINE} strokeWidth={1.8} />
    <circle cx="317" cy="397" r="30" fill={INK} fillOpacity={0.08} />
    <circle cx="317" cy="397" r="11" fill={TEAL} stroke={INK} strokeOpacity={0.55} strokeWidth={1.8} />
    <circle cx="363" cy="443" r="6" fill={GOLD} />
  </svg>
);
