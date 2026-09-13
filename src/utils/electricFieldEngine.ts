/**
 * Electrostatic fields from point charges, evaluated directly.
 *
 * Like the wave-interference engine, nothing here is stepped forward in time:
 * Coulomb's law gives each charge's field in closed form at any point, and
 * superposition makes the total a plain vector sum. What makes it a
 * simulation is scale — many charges, the image charges a grounded conductor
 * induces, and every point on a grid — which is "How a Simulation Thinks" in
 * Lesson 7. Field lines are the only thing traced step by step.
 */

/** Coulomb's constant at the precision Lesson 7's worked example uses, N·m²/C². */
export const K = 8.99e9;

/** Fixed length for the colour scale, so moving the charges doesn't re-tint the field. */
export const REFERENCE_LENGTH = 0.04; // m

export interface PointCharge {
  x: number; // m
  y: number; // m
  q: number; // C
}

/**
 * An infinite grounded conducting plane along y = `y`, conductor below it.
 * The method of images is exact for this geometry: above the plate, the
 * charge the conductor induces on its surface produces the same field as a
 * mirror-image charge of opposite sign.
 */
export interface GroundedPlate {
  y: number; // m
}

export interface ElectricFieldParams {
  charges: PointCharge[];
  plate: GroundedPlate | null;
  width: number; // m
  height: number; // m
}

export interface FieldVector {
  ex: number; // N/C
  ey: number; // N/C
}

/** Real charges plus, when a plate is present, their images. */
export function sourcesWithImages(params: ElectricFieldParams): PointCharge[] {
  const { charges, plate } = params;
  if (!plate) return charges;
  return [...charges, ...charges.map((c) => ({ x: c.x, y: 2 * plate.y - c.y, q: -c.q }))];
}

/** A conductor in equilibrium has no field inside it. */
export function insideConductor(params: ElectricFieldParams, y: number): boolean {
  return params.plate !== null && y < params.plate.y;
}

export function fieldAt(
  params: ElectricFieldParams,
  x: number,
  y: number,
  sources: PointCharge[] = sourcesWithImages(params)
): FieldVector {
  if (insideConductor(params, y)) return { ex: 0, ey: 0 };
  let ex = 0;
  let ey = 0;
  for (const c of sources) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 === 0) continue; // a point charge's own field is undefined at its location
    const scale = (K * c.q) / (r2 * Math.sqrt(r2));
    ex += scale * dx;
    ey += scale * dy;
  }
  return { ex, ey };
}

export const magnitudeOf = (f: FieldVector): number => Math.hypot(f.ex, f.ey);

/** Field of the strongest real charge at REFERENCE_LENGTH — the colour scale's anchor. */
export function referenceField(params: ElectricFieldParams): number {
  const maxQ = params.charges.reduce((m, c) => Math.max(m, Math.abs(c.q)), 0);
  return (K * Math.max(maxQ, 1e-12)) / (REFERENCE_LENGTH * REFERENCE_LENGTH);
}

export interface ElectricFieldGrid {
  /** |E| in N/C; Infinity exactly on a charge, 0 inside the conductor. */
  magnitude: Float32Array;
  ex: Float32Array;
  ey: Float32Array;
  gridRes: number;
}

/** Evaluates the field at every node of a gridRes × gridRes grid spanning the domain. */
export function computeFieldGrid(params: ElectricFieldParams, gridRes: number): ElectricFieldGrid {
  const n = gridRes * gridRes;
  const magnitude = new Float32Array(n);
  const ex = new Float32Array(n);
  const ey = new Float32Array(n);
  const sources = sourcesWithImages(params);

  for (let j = 0; j < gridRes; j++) {
    const y = (j / (gridRes - 1)) * params.height;
    if (insideConductor(params, y)) continue; // the arrays already hold zeros
    for (let i = 0; i < gridRes; i++) {
      const x = (i / (gridRes - 1)) * params.width;
      const idx = j * gridRes + i;
      let fx = 0;
      let fy = 0;
      let onCharge = false;
      for (const c of sources) {
        const dx = x - c.x;
        const dy = y - c.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < 1e-14) {
          onCharge = true;
          break;
        }
        const scale = (K * c.q) / (r2 * Math.sqrt(r2));
        fx += scale * dx;
        fy += scale * dy;
      }
      if (onCharge) {
        magnitude[idx] = Infinity;
      } else {
        ex[idx] = fx;
        ey[idx] = fy;
        magnitude[idx] = Math.hypot(fx, fy);
      }
    }
  }

  return { magnitude, ex, ey, gridRes };
}

/** Part 3's closed form: |E| on the perpendicular bisector of two identical charges. */
export function bisectorFieldExact(q: number, d: number, L: number): number {
  return (2 * K * q * L) / Math.pow(L * L + (d / 2) * (d / 2), 1.5);
}

export type FieldLine = [number, number][];

/**
 * Traces field lines from each charge — along E from positive charges,
 * against it from negative ones — with a midpoint step on the unit direction
 * field. A line stops at the domain edge, on the plate, on reaching another
 * charge, or where the field turns back on itself (a null point, where
 * direction is undefined). Seed count is proportional to |q|, so a stronger
 * charge visibly carries more lines. A negative charge's lines that end on a
 * positive charge are dropped: that positive charge already drew them.
 */
export function traceFieldLines(params: ElectricFieldParams, linesForStrongest = 16): FieldLine[] {
  const { charges, width, height, plate } = params;
  const sources = sourcesWithImages(params);
  const maxQ = charges.reduce((m, c) => Math.max(m, Math.abs(c.q)), 0);
  if (maxQ === 0) return [];

  const seedRadius = width * 0.02;
  const stopRadius = width * 0.015;
  const ds = width / 320;
  const maxSteps = 1400;
  const lines: FieldLine[] = [];

  for (const origin of charges) {
    if (origin.q === 0) continue;
    const sign = Math.sign(origin.q);
    const direction = (px: number, py: number): [number, number] | null => {
      const f = fieldAt(params, px, py, sources);
      const m = Math.hypot(f.ex, f.ey);
      return m > 0 && Number.isFinite(m) ? [(sign * f.ex) / m, (sign * f.ey) / m] : null;
    };

    const count = Math.round((linesForStrongest * Math.abs(origin.q)) / maxQ);
    if (count === 0) continue;
    for (let s = 0; s < count; s++) {
      const angle = (2 * Math.PI * (s + 0.5)) / count;
      let x = origin.x + seedRadius * Math.cos(angle);
      let y = origin.y + seedRadius * Math.sin(angle);
      const line: FieldLine = [[origin.x, origin.y], [x, y]];
      let previous: [number, number] | null = null;
      let endedOn: PointCharge | null = null;

      for (let step = 0; step < maxSteps; step++) {
        const d1 = direction(x, y);
        if (!d1) break;
        const d2 = direction(x + 0.5 * ds * d1[0], y + 0.5 * ds * d1[1]);
        if (!d2) break;
        if (previous && previous[0] * d2[0] + previous[1] * d2[1] < 0) break;
        x += ds * d2[0];
        y += ds * d2[1];
        previous = d2;

        if (plate && y < plate.y) {
          line.push([x, plate.y]);
          break;
        }
        line.push([x, y]);
        if (x < 0 || x > width || y < 0 || y > height) break;
        endedOn = charges.find((c) => c !== origin && Math.hypot(x - c.x, y - c.y) < stopRadius) ?? null;
        if (endedOn) break;
      }

      if (sign < 0 && endedOn && endedOn.q > 0) continue;
      lines.push(line);
    }
  }

  return lines;
}

const SUPERSCRIPTS: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/**
 * Formats a field strength like "2.30×10⁷". Anything below `zeroBelow` prints
 * as 0: floating-point cancellation at a true null leaves a residue many
 * orders of magnitude under any real field, and it should read as zero.
 */
export function formatField(value: number, zeroBelow = 0, digits = 2): string {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) <= zeroBelow) return '0';
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = Number((value / 10 ** exponent).toFixed(digits));
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  if (exponent === 0) return mantissa.toFixed(digits);
  const sup = String(exponent)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch])
    .join('');
  return `${mantissa.toFixed(digits)}×10${sup}`;
}
