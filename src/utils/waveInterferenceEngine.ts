/**
 * Wave interference over a 2D surface.
 *
 * Every engine before this one stepped a state forward in small time
 * increments because there was no other way to find the next instant. This
 * one is different: a traveling wave from a point source has a known,
 * closed-form value at any position and time, so the field doesn't need to
 * be integrated at all — it can be evaluated directly, anywhere, anytime.
 * What makes this a *simulation* rather than a formula is scale: many
 * sources, their reflections, and every point on a whole grid, all summed
 * together every frame. That matches "How a Simulation Thinks" in the
 * lesson exactly — calculate each source's contribution, add reflections,
 * sum via superposition, repeat for every point on the grid.
 */

export interface WaveSource {
  x: number; // m
  y: number; // m
  amplitude: number; // m
  frequency: number; // Hz
  wavelength: number; // m
  phase: number; // radians
}

/** A single straight, axis-aligned reflecting wall, modeled with the method of images. */
export interface Reflector {
  axis: 'x' | 'y';
  position: number; // the wall's coordinate along that axis, m
  reflectivity: number; // 0..1, amplitude fraction that reflects back
}

export interface WaveFieldParams {
  sources: WaveSource[];
  reflectors: Reflector[];
  width: number; // domain width, m
  height: number; // domain height, m
}

/** The mirror-image source a reflector produces — same wave, flipped position, phase-inverted by the reflection, scaled by reflectivity. */
function imageSource(src: WaveSource, r: Reflector): WaveSource {
  if (r.axis === 'x') {
    return { ...src, x: 2 * r.position - src.x, amplitude: src.amplitude * r.reflectivity, phase: src.phase + Math.PI };
  }
  return { ...src, y: 2 * r.position - src.y, amplitude: src.amplitude * r.reflectivity, phase: src.phase + Math.PI };
}

function allContributingSources(params: WaveFieldParams): WaveSource[] {
  const all: WaveSource[] = [...params.sources];
  for (const r of params.reflectors) {
    for (const s of params.sources) all.push(imageSource(s, r));
  }
  return all;
}

function waveValue(src: WaveSource, x: number, y: number, t: number): number {
  const r = Math.hypot(x - src.x, y - src.y);
  return src.amplitude * Math.sin(2 * Math.PI * (src.frequency * t - r / src.wavelength) + src.phase);
}

export function fieldValueAt(params: WaveFieldParams, x: number, y: number, t: number): number {
  let total = 0;
  for (const src of allContributingSources(params)) total += waveValue(src, x, y, t);
  return total;
}

export interface FieldGrid {
  values: Float32Array;
  gridRes: number;
  /** Sum of all real source amplitudes — a stable normalization ceiling so the color scale doesn't flicker as the pattern phases in and out. */
  maxAmplitude: number;
}

export function computeFieldGrid(params: WaveFieldParams, t: number, gridRes: number): FieldGrid {
  const values = new Float32Array(gridRes * gridRes);
  const sources = allContributingSources(params);
  const maxAmplitude = Math.max(
    params.sources.reduce((sum, s) => sum + s.amplitude, 0),
    1e-9
  );

  for (let j = 0; j < gridRes; j++) {
    const y = (j / (gridRes - 1)) * params.height;
    for (let i = 0; i < gridRes; i++) {
      const x = (i / (gridRes - 1)) * params.width;
      let total = 0;
      for (const src of sources) total += waveValue(src, x, y, t);
      values[j * gridRes + i] = total;
    }
  }

  return { values, gridRes, maxAmplitude };
}

/** The exact two-source result from Part 3: new amplitude = 2A·cos(Δφ/2). */
export function twoSourceAmplitude(amplitude: number, deltaPhi: number): number {
  return 2 * amplitude * Math.cos(deltaPhi / 2);
}

/**
 * Measures the peak amplitude actually produced at a point by sampling
 * across several seconds, rather than assuming a formula. With exactly two
 * identical sources and no reflections, this should land on
 * twoSourceAmplitude — a real check, not just a label, and one that
 * correctly stops matching the moment a third source, a reflector, or a
 * frequency mismatch makes the closed form no longer apply.
 */
export function probePeakAmplitude(params: WaveFieldParams, x: number, y: number, windowS = 8, samples = 600): number {
  let maxAbs = 0;
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * windowS;
    maxAbs = Math.max(maxAbs, Math.abs(fieldValueAt(params, x, y, t)));
  }
  return maxAbs;
}
