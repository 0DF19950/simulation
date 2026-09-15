/**
 * Quantum tunneling: an electron's wave packet meeting potential-energy
 * barriers.
 *
 * Units follow the lesson: energies in electronvolts, lengths in nanometres,
 * time in femtoseconds. Exact answers come from matching the wavefunction and
 * its slope across every flat piece of the potential — the transfer-matrix
 * method, which reduces to the lesson's formula for one rectangular barrier.
 * Simulations use the split-operator method: the potential acts point by
 * point, and the curvature acts in wavenumber space through a Fourier
 * transform, where it is exact.
 */

/** ħ²/2m for an electron, eV·nm². */
export const HB2M = 0.0380998;
/** ħ, eV·fs. */
export const HBAR = 0.6582119569;
/** e²/4πε₀, eV·nm: two electrons 1 nm apart repel with 1.44 eV. */
export const COULOMB = 1.439964;

/** κ = √(2m(V₀ − E))/ħ, nm⁻¹: how fast the wavefunction dies away inside a barrier. */
export const decayRate = (energy: number, height: number): number => Math.sqrt(Math.max(0, height - energy) / HB2M);

/** The lesson's exact formula for one rectangular barrier, with its above-the-top and E = V₀ forms. */
export function transmissionRect(E: number, V0: number, L: number): number {
  if (E <= 0) return 0;
  if (L <= 0 || V0 === 0) return 1;
  if (Math.abs(E - V0) < 1e-9) return 1 / (1 + (V0 * L * L) / (4 * HB2M));
  if (E < V0) {
    const s = Math.sinh(decayRate(E, V0) * L);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E)));
  }
  const s = Math.sin(Math.sqrt((E - V0) / HB2M) * L);
  return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
}

/** The thick-barrier shortcut, 16(E/V₀)(1 − E/V₀)·e^(−2κL). */
export const thickBarrierT = (E: number, V0: number, L: number): number =>
  16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * decayRate(E, V0) * L);

export interface Layer {
  /** nm */
  width: number;
  /** eV */
  height: number;
}

type Cx = [number, number];
const cAdd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const cSub = (a: Cx, b: Cx): Cx => [a[0] - b[0], a[1] - b[1]];
const cMul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cInv = (a: Cx): Cx => {
  const d = a[0] * a[0] + a[1] * a[1];
  return [a[0] / d, -a[1] / d];
};

/**
 * Exact transmission through a stack of flat layers with free space on both
 * sides. In each layer ψ = A·e^(ikx) + B·e^(−ikx), with k imaginary where the
 * layer is taller than E; matching ψ and dψ/dx at every edge links the
 * coefficients, and T = 1/|M₂₂|² for the product matrix M.
 */
export function transmission(E: number, layers: Layer[]): number {
  if (E <= 0) return 0;
  const kOf = (V: number): Cx => {
    const d = Math.abs(E - V) < 1e-9 ? 1e-9 : E - V;
    return d > 0 ? [Math.sqrt(d / HB2M), 0] : [0, Math.sqrt(-d / HB2M)];
  };
  let M: [Cx, Cx, Cx, Cx] = [[1, 0], [0, 0], [0, 0], [1, 0]];
  let k = kOf(0);
  const cross = (k2: Cx) => {
    const inv = cInv([2 * k2[0], 2 * k2[1]]);
    const a = cMul(cAdd(k2, k), inv);
    const b = cMul(cSub(k2, k), inv);
    M = [cAdd(cMul(a, M[0]), cMul(b, M[2])), cAdd(cMul(a, M[1]), cMul(b, M[3])), cAdd(cMul(b, M[0]), cMul(a, M[2])), cAdd(cMul(b, M[1]), cMul(a, M[3]))];
    k = k2;
  };
  for (const layer of layers) {
    if (layer.width <= 0) continue;
    cross(kOf(layer.height));
    const grow = Math.exp(-k[1] * layer.width);
    const c = Math.cos(k[0] * layer.width);
    const s = Math.sin(k[0] * layer.width);
    const forward: Cx = [grow * c, grow * s];
    const backward: Cx = [c / grow, -s / grow];
    M = [cMul(forward, M[0]), cMul(forward, M[1]), cMul(backward, M[2]), cMul(backward, M[3])];
  }
  cross(kOf(0));
  return 1 / (M[3][0] * M[3][0] + M[3][1] * M[3][1]);
}

export interface Barrier {
  /** Left edge, nm. */
  start: number;
  /** nm */
  width: number;
  /** eV */
  height: number;
}

/** Barriers as layers, with the flat gaps between them. */
export function layersOf(barriers: Barrier[]): Layer[] {
  const sorted = [...barriers].sort((a, b) => a.start - b.start);
  const layers: Layer[] = [];
  sorted.forEach((b, i) => {
    if (i > 0) layers.push({ width: b.start - (sorted[i - 1].start + sorted[i - 1].width), height: 0 });
    layers.push({ width: b.width, height: b.height });
  });
  return layers;
}

/** A sampled potential as layers: every run of equal cells between the first and last non-zero one. */
export function layersFromCells(V: ArrayLike<number>, dx: number): Layer[] {
  let first = -1;
  let last = -1;
  for (let i = 0; i < V.length; i++) {
    if (V[i] !== 0) {
      if (first < 0) first = i;
      last = i;
    }
  }
  const layers: Layer[] = [];
  for (let i = first; i >= 0 && i <= last; i++) {
    const top = layers[layers.length - 1];
    if (top && top.height === V[i]) top.width += dx;
    else layers.push({ width: dx, height: V[i] });
  }
  return layers;
}

/** Local maxima of a sampled curve above `floor`, e.g. resonance peaks in T(E). */
export function findPeaks(xs: ArrayLike<number>, ys: ArrayLike<number>, floor = 0.05): { x: number; y: number }[] {
  const peaks: { x: number; y: number }[] = [];
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > floor) peaks.push({ x: xs[i], y: ys[i] });
  return peaks;
}

/**
 * Transmission averaged over a Gaussian packet's momenta, |φ(k)|² ∝ exp(−2σ²(k − k₀)²),
 * sampled finely enough to resolve resonances a few meV wide. Parts moving left
 * count as reflected. (A simulation box's own Fourier modes are far too coarse
 * for this: 51 nm of box spaces them about 20 meV apart.)
 */
export function packetTransmission(energy: number, width: number, T: (E: number) => number, samples = 3000): number {
  const k0 = Math.sqrt(Math.max(0, energy) / HB2M);
  const sk = 1 / (2 * width);
  const lo = k0 - 7 * sk;
  const dk = (14 * sk) / samples;
  let weight = 0;
  let through = 0;
  for (let i = 0; i < samples; i++) {
    const k = lo + (i + 0.5) * dk;
    const w = Math.exp(-((k - k0) ** 2) / (2 * sk * sk));
    weight += w;
    if (k > 0) through += w * T(HB2M * k * k);
  }
  return through / weight;
}

/** Mean and rms spread of a Gaussian packet's energy, eV. */
export function packetEnergy(energy: number, width: number): { mean: number; spread: number } {
  const k0 = Math.sqrt(Math.max(0, energy) / HB2M);
  const sk = 1 / (2 * width);
  return { mean: HB2M * (k0 * k0 + sk * sk), spread: HB2M * Math.sqrt(4 * k0 * k0 * sk * sk + 2 * sk ** 4) };
}

// ─── Grids and Fourier transforms ────────────────────────────────────────────

export interface Grid {
  n: number;
  dx: number;
  /** Cell centres: cell i spans [(i − n/2)·dx, (i − n/2 + 1)·dx), so edges on multiples of dx are exact. */
  x: Float64Array;
}

export function makeGrid(n: number, dx: number): Grid {
  return { n, dx, x: Float64Array.from({ length: n }, (_, i) => (i - n / 2 + 0.5) * dx) };
}

/** Barriers sampled onto a grid; edges snap to the nearest cell boundary. */
export function potentialOn(grid: Grid, barriers: Barrier[]): Float64Array {
  const V = new Float64Array(grid.n);
  for (const b of barriers) {
    const from = grid.n / 2 + Math.round(b.start / grid.dx);
    const to = from + Math.round(b.width / grid.dx);
    for (let i = Math.max(0, from); i < Math.min(grid.n, to); i++) V[i] = b.height;
  }
  return V;
}

/** An in-place radix-2 FFT on separate real and imaginary arrays; the inverse includes the 1/n. */
export function makeFFT(n: number): (re: Float64Array, im: Float64Array, inverse: boolean) => void {
  const levels = Math.round(Math.log2(n));
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < levels; b++) r |= ((i >> b) & 1) << (levels - 1 - b);
    rev[i] = r;
  }
  const cosT = new Float64Array(n / 2);
  const sinT = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cosT[i] = Math.cos((2 * Math.PI * i) / n);
    sinT[i] = Math.sin((2 * Math.PI * i) / n);
  }
  return (re, im, inverse) => {
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (i < j) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += step) {
          const a = i + j;
          const b = a + half;
          const c = cosT[k];
          const s = inverse ? -sinT[k] : sinT[k];
          const tr = re[b] * c + im[b] * s;
          const ti = im[b] * c - re[b] * s;
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
    if (inverse) {
      const inv = 1 / n;
      for (let i = 0; i < n; i++) {
        re[i] *= inv;
        im[i] *= inv;
      }
    }
  };
}

const waveNumbers = (grid: Grid): Float64Array => {
  const dk = (2 * Math.PI) / (grid.n * grid.dx);
  return Float64Array.from({ length: grid.n }, (_, j) => (j < grid.n / 2 ? j : j - grid.n) * dk);
};

/** A Gaussian packet ψ ∝ exp(−(x − x₀)²/4σ² + ik₀x), normalised so Σ|ψ|²dx = 1. */
function gaussianPacket(grid: Grid, energy: number, width: number, start: number): { re: Float64Array; im: Float64Array } {
  const k0 = Math.sqrt(Math.max(0, energy) / HB2M);
  const re = new Float64Array(grid.n);
  const im = new Float64Array(grid.n);
  let norm = 0;
  for (let i = 0; i < grid.n; i++) {
    const env = Math.exp(-((grid.x[i] - start) ** 2) / (4 * width * width));
    re[i] = env * Math.cos(k0 * grid.x[i]);
    im[i] = env * Math.sin(k0 * grid.x[i]);
    norm += env * env * grid.dx;
  }
  const scale = 1 / Math.sqrt(norm);
  for (let i = 0; i < grid.n; i++) {
    re[i] *= scale;
    im[i] *= scale;
  }
  return { re, im };
}

/** Per-step damping near both edges, so waves leaving the picture don't wrap around. */
function edgeMask(grid: Grid, absorb: number, dt: number): Float64Array {
  const edge = (grid.n / 2) * grid.dx - absorb;
  return Float64Array.from(grid.x, (x) => {
    const d = Math.max(0, Math.abs(x) - edge) / absorb;
    return Math.exp(-3 * d * d * dt);
  });
}

// ─── One particle ────────────────────────────────────────────────────────────

export interface Drive {
  /** Swing of the barrier height, as a fraction of it. */
  amplitude: number;
  /** fs */
  period: number;
}

export interface PacketParams {
  grid: Grid;
  potential: Float64Array;
  /** Centre energy, eV. */
  energy: number;
  /** σ, the spread of |ψ|², nm. */
  width: number;
  /** Starting centre, nm. */
  start: number;
  /** fs */
  dt: number;
  /** fs */
  duration: number;
  drive?: Drive;
  frames?: number;
  /** Absorbing layer at each edge, nm. */
  absorb?: number;
}

export interface PacketRun {
  times: Float64Array;
  /** |ψ|² per frame: density[f·n + i], nm⁻¹. */
  density: Float32Array;
  nFrames: number;
  /** Probability left of, inside and right of the barrier region per frame, counting what the edges absorbed. */
  left: Float64Array;
  inside: Float64Array;
  right: Float64Array;
  /** Barrier height relative to its still value, per frame. */
  heightScale: Float64Array;
  peak: number;
  /** Where the potential is non-zero, nm. */
  regionStart: number;
  regionEnd: number;
}

export function runPacket(p: PacketParams): PacketRun {
  const { grid, potential: V, dt } = p;
  const n = grid.n;
  const fft = makeFFT(n);
  const { re, im } = gaussianPacket(grid, p.energy, p.width, p.start);
  const k = waveNumbers(grid);

  let first = -1;
  let last = -1;
  for (let i = 0; i < n; i++) {
    if (V[i] !== 0) {
      if (first < 0) first = i;
      last = i;
    }
  }
  const regionStart = first < 0 ? 0 : grid.x[first] - grid.dx / 2;
  const regionEnd = last < 0 ? 0 : grid.x[last] + grid.dx / 2;

  const kc = new Float64Array(n);
  const ks = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const phase = (-HB2M * k[j] * k[j] * dt) / HBAR;
    kc[j] = Math.cos(phase);
    ks[j] = Math.sin(phase);
  }
  const mask = edgeMask(grid, p.absorb ?? 4, dt);

  const steps = Math.round(p.duration / dt);
  const recordEvery = Math.max(1, Math.floor(steps / (p.frames ?? 240)));
  const nFrames = Math.floor(steps / recordEvery) + 1;
  const times = new Float64Array(nFrames);
  const density = new Float32Array(nFrames * n);
  const left = new Float64Array(nFrames);
  const inside = new Float64Array(nFrames);
  const right = new Float64Array(nFrames);
  const heightScale = new Float64Array(nFrames);
  let absorbedLeft = 0;
  let absorbedRight = 0;
  let peak = 0;
  let frame = 0;

  const scaleAt = (t: number) => (p.drive ? 1 + p.drive.amplitude * Math.sin((2 * Math.PI * t) / p.drive.period) : 1);
  const record = (step: number) => {
    let l = absorbedLeft;
    let r = absorbedRight;
    let mid = 0;
    for (let i = 0; i < n; i++) {
      const d = re[i] * re[i] + im[i] * im[i];
      density[frame * n + i] = d;
      peak = Math.max(peak, d);
      const pr = d * grid.dx;
      if (first < 0 || i < first) l += pr;
      else if (i > last) r += pr;
      else mid += pr;
    }
    times[frame] = step * dt;
    left[frame] = l;
    inside[frame] = mid;
    right[frame] = r;
    heightScale[frame] = scaleAt(step * dt);
    frame++;
  };
  const kick = (scale: number) => {
    for (let i = first; i >= 0 && i <= last; i++) {
      if (V[i] === 0) continue;
      const phase = (-V[i] * scale * dt) / (2 * HBAR);
      const c = Math.cos(phase);
      const s = Math.sin(phase);
      const r = re[i] * c - im[i] * s;
      im[i] = re[i] * s + im[i] * c;
      re[i] = r;
    }
  };

  record(0);
  for (let step = 1; step <= steps; step++) {
    const scale = scaleAt((step - 0.5) * dt);
    kick(scale);
    fft(re, im, false);
    for (let j = 0; j < n; j++) {
      const r = re[j] * kc[j] - im[j] * ks[j];
      im[j] = re[j] * ks[j] + im[j] * kc[j];
      re[j] = r;
    }
    fft(re, im, true);
    kick(scale);
    for (let i = 0; i < n; i++) {
      if (mask[i] === 1) continue;
      const before = re[i] * re[i] + im[i] * im[i];
      re[i] *= mask[i];
      im[i] *= mask[i];
      const lost = (before - re[i] * re[i] - im[i] * im[i]) * grid.dx;
      if (grid.x[i] > 0) absorbedRight += lost;
      else absorbedLeft += lost;
    }
    if (step % recordEvery === 0) record(step);
  }

  return {
    times,
    density,
    nFrames: frame,
    left,
    inside,
    right,
    heightScale,
    peak,
    regionStart,
    regionEnd,
  };
}

// ─── Two particles ───────────────────────────────────────────────────────────

export interface PairParams {
  grid: Grid;
  barrier: Barrier;
  energy: number;
  width: number;
  /** Starting centres of the front and back electron, nm. */
  front: number;
  back: number;
  /** Share of full, unscreened Coulomb repulsion. */
  strength: number;
  /** Softening length that keeps the repulsion finite at contact, nm. */
  soft: number;
  dt: number;
  duration: number;
  frames?: number;
  absorb?: number;
}

export interface PairRun {
  times: Float64Array;
  nFrames: number;
  /** Each electron's own probability density per frame (the other one integrated out), nm⁻¹. */
  frontDensity: Float32Array;
  backDensity: Float32Array;
  peak: number;
  /** Probabilities per frame that the front, the back, and both electrons are past the barrier. */
  frontThrough: Float64Array;
  backThrough: Float64Array;
  bothThrough: Float64Array;
  /** At the end: every combination, plus whatever is still inside the barrier. */
  outcome: { bothThrough: number; frontOnly: number; backOnly: number; bothBack: number; undecided: number };
}

/**
 * Two electrons with opposite spins — so they can be told apart — in one
 * dimension. The wavefunction ψ(x_front, x_back) lives on an n × n grid, and
 * the repulsion couples the two coordinates, so it can't be split into two
 * one-particle problems. Runs in slices, yielding to the page between them.
 */
export async function runPair(p: PairParams, onProgress?: (share: number) => void, cancelled?: () => boolean): Promise<PairRun | null> {
  const { grid, dt } = p;
  const n = grid.n;
  const size = n * n;
  const fft = makeFFT(n);
  const x = grid.x;
  const dx = grid.dx;
  const V1 = potentialOn(grid, [p.barrier]);
  const bFirst = V1.findIndex((v) => v !== 0);
  let bLast = bFirst;
  for (let i = 0; i < n; i++) if (V1[i] !== 0) bLast = i;
  // 0: before the barrier, 1: past it, 2: inside it.
  const side = Uint8Array.from({ length: n }, (_, i) => (i < bFirst ? 0 : i > bLast ? 1 : 2));

  const a = gaussianPacket(grid, p.energy, p.width, p.front);
  const b = gaussianPacket(grid, p.energy, p.width, p.back);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      re[i * n + j] = a.re[i] * b.re[j] - a.im[i] * b.im[j];
      im[i * n + j] = a.re[i] * b.im[j] + a.im[i] * b.re[j];
    }
  }

  const pc = new Float64Array(size);
  const ps = new Float64Array(size);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const repulsion = (p.strength * COULOMB) / Math.sqrt((x[i] - x[j]) ** 2 + p.soft * p.soft);
      const phase = (-(V1[i] + V1[j] + repulsion) * dt) / (2 * HBAR);
      pc[i * n + j] = Math.cos(phase);
      ps[i * n + j] = Math.sin(phase);
    }
  }
  const k = waveNumbers(grid);
  const kc = new Float64Array(size);
  const ks = new Float64Array(size);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const phase = (-HB2M * (k[i] * k[i] + k[j] * k[j]) * dt) / HBAR;
      kc[i * n + j] = Math.cos(phase);
      ks[i * n + j] = Math.sin(phase);
    }
  }
  const mask = edgeMask(grid, p.absorb ?? 3, dt);

  const rowR = new Float64Array(n);
  const rowI = new Float64Array(n);
  const transform = (inverse: boolean) => {
    for (let r = 0; r < n; r++) {
      const o = r * n;
      for (let c = 0; c < n; c++) {
        rowR[c] = re[o + c];
        rowI[c] = im[o + c];
      }
      fft(rowR, rowI, inverse);
      for (let c = 0; c < n; c++) {
        re[o + c] = rowR[c];
        im[o + c] = rowI[c];
      }
    }
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n; r++) {
        rowR[r] = re[r * n + c];
        rowI[r] = im[r * n + c];
      }
      fft(rowR, rowI, inverse);
      for (let r = 0; r < n; r++) {
        re[r * n + c] = rowR[r];
        im[r * n + c] = rowI[r];
      }
    }
  };
  const rotate = (c: Float64Array, s: Float64Array) => {
    for (let q = 0; q < size; q++) {
      const r = re[q] * c[q] - im[q] * s[q];
      im[q] = re[q] * s[q] + im[q] * c[q];
      re[q] = r;
    }
  };

  const steps = Math.round(p.duration / dt);
  const recordEvery = Math.max(1, Math.floor(steps / (p.frames ?? 200)));
  const nFrames = Math.floor(steps / recordEvery) + 1;
  const times = new Float64Array(nFrames);
  const frontDensity = new Float32Array(nFrames * n);
  const backDensity = new Float32Array(nFrames * n);
  const frontThrough = new Float64Array(nFrames);
  const backThrough = new Float64Array(nFrames);
  const bothThrough = new Float64Array(nFrames);
  const absorbed = new Float64Array(9);
  const quadrants = new Float64Array(9);
  let peak = 0;
  let frame = 0;

  const tally = () => {
    quadrants.set(absorbed);
    for (let i = 0; i < n; i++) {
      const si = side[i] * 3;
      for (let j = 0; j < n; j++) {
        const q = i * n + j;
        const d = (re[q] * re[q] + im[q] * im[q]) * dx * dx;
        quadrants[si + side[j]] += d;
        frontDensity[frame * n + i] += d / dx;
        backDensity[frame * n + j] += d / dx;
      }
    }
  };
  const record = (step: number) => {
    tally();
    for (let i = 0; i < n; i++) peak = Math.max(peak, frontDensity[frame * n + i], backDensity[frame * n + i]);
    times[frame] = step * dt;
    frontThrough[frame] = quadrants[3] + quadrants[4] + quadrants[5];
    backThrough[frame] = quadrants[1] + quadrants[4] + quadrants[7];
    bothThrough[frame] = quadrants[4];
    frame++;
  };

  record(0);
  for (let step = 1; step <= steps; step++) {
    rotate(pc, ps);
    transform(false);
    rotate(kc, ks);
    transform(true);
    rotate(pc, ps);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const m = mask[i] * mask[j];
        if (m === 1) continue;
        const q = i * n + j;
        const before = re[q] * re[q] + im[q] * im[q];
        re[q] *= m;
        im[q] *= m;
        absorbed[side[i] * 3 + side[j]] += (before - re[q] * re[q] - im[q] * im[q]) * dx * dx;
      }
    }
    if (step % recordEvery === 0) record(step);
    if (step % 25 === 0) {
      onProgress?.(step / steps);
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled?.()) return null;
    }
  }

  const undecided = quadrants[2] + quadrants[5] + quadrants[6] + quadrants[7] + quadrants[8];
  return {
    times,
    nFrames: frame,
    frontDensity,
    backDensity,
    peak,
    frontThrough,
    backThrough,
    bothThrough,
    outcome: { bothThrough: quadrants[4], frontOnly: quadrants[3], backOnly: quadrants[1], bothBack: quadrants[0], undecided },
  };
}
