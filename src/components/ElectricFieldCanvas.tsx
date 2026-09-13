import React, { useEffect, useRef } from 'react';
import { FieldLine, PointCharge } from '../utils/electricFieldEngine';

interface ElectricFieldCanvasProps {
  /** |E| at each grid node; row 0 is y = 0, the bottom of the domain. */
  magnitude: Float32Array;
  gridRes: number;
  /** The field strength placed mid-scale; the colour map spans 1.5 decades either side of it. */
  referenceField: number;
  width: number; // domain, m
  height: number; // domain, m
  charges: PointCharge[];
  fieldLines?: FieldLine[];
  /** Direction glyphs from sampled grid vectors — for when only a grid exists (the Python lab). */
  arrows?: { ex: Float32Array; ey: Float32Array; every: number };
  plateY?: number | null;
  probe?: { x: number; y: number };
  /** Field at the probe, drawn as an arrow so its direction shows as well as its size. */
  probeField?: { ex: number; ey: number };
  label?: string;
}

const DECADES = 1.5;
const STOPS: [number, [number, number, number]][] = [
  [0, [14, 43, 52]], // #0E2B34
  [0.45, [40, 90, 106]], // #285A6A
  [0.78, [166, 205, 198]], // #A6CDC6
  [1, [221, 168, 83]], // #DDA853
];

/**
 * Log-scale sequential map, weak field dark and strong field gold. Field
 * strength spans orders of magnitude around point charges, so a linear scale
 * would show saturated dots on a black field.
 */
function colorFor(magnitude: number, reference: number): [number, number, number] {
  let t: number;
  if (!(magnitude > 0)) t = 0;
  else if (!Number.isFinite(magnitude)) t = 1;
  else t = Math.max(0, Math.min(1, (Math.log10(magnitude / reference) + DECADES) / (2 * DECADES)));

  for (let s = 1; s < STOPS.length; s++) {
    const [t1, c1] = STOPS[s];
    if (t <= t1) {
      const [t0, c0] = STOPS[s - 1];
      const f = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** Field-strength heatmap with field lines or arrows, charges, an optional plate and probe. */
export const ElectricFieldCanvas: React.FC<ElectricFieldCanvasProps> = ({
  magnitude,
  gridRes,
  referenceField,
  width,
  height,
  charges,
  fieldLines,
  arrows,
  plateY = null,
  probe,
  probeField,
  label = 'Electric field strength and field lines',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
    const off = offscreenRef.current;
    if (off.width !== gridRes || off.height !== gridRes) {
      off.width = gridRes;
      off.height = gridRes;
    }
    const offCtx = off.getContext('2d');
    if (!offCtx) return;

    const img = offCtx.createImageData(gridRes, gridRes);
    for (let j = 0; j < gridRes; j++) {
      const outRow = gridRes - 1 - j; // grid row 0 is the bottom; canvas row 0 is the top
      for (let i = 0; i < gridRes; i++) {
        const [r, g, b] = colorFor(magnitude[j * gridRes + i], referenceField);
        const idx = (outRow * gridRes + i) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    if (size === 0) return;
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, gridRes, gridRes, 0, 0, size, size);

    const px = (x: number) => (x / width) * size;
    const py = (y: number) => size - (y / height) * size;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();

    if (plateY !== null) {
      const top = py(plateY);
      ctx.fillStyle = 'rgba(22, 64, 77, 0.92)';
      ctx.fillRect(0, top, size, size - top);
      ctx.strokeStyle = 'rgba(166, 205, 198, 0.22)';
      ctx.lineWidth = 1;
      for (let hx = -size; hx < size; hx += 8) {
        ctx.beginPath();
        ctx.moveTo(hx, size);
        ctx.lineTo(hx + (size - top), top);
        ctx.stroke();
      }
      ctx.fillStyle = '#7CA7A0';
      ctx.fillRect(0, top - 1.5, size, 3);
    }

    if (fieldLines) {
      ctx.strokeStyle = 'rgba(251, 245, 221, 0.6)';
      ctx.lineWidth = 1;
      for (const line of fieldLines) {
        if (line.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(px(line[0][0]), py(line[0][1]));
        for (let k = 1; k < line.length; k++) ctx.lineTo(px(line[k][0]), py(line[k][1]));
        ctx.stroke();
      }
    }

    if (arrows) {
      const spacing = (size / (gridRes - 1)) * arrows.every;
      const half = spacing * 0.34;
      const start = Math.floor(arrows.every / 2);
      ctx.lineWidth = 1.2;
      for (let j = start; j < gridRes; j += arrows.every) {
        for (let i = start; i < gridRes; i += arrows.every) {
          const idx = j * gridRes + i;
          const m = magnitude[idx];
          if (!(m > 0) || !Number.isFinite(m)) continue;
          const ux = arrows.ex[idx] / m;
          const uy = -arrows.ey[idx] / m; // canvas y points down
          const cxp = (i / (gridRes - 1)) * size;
          const cyp = size - (j / (gridRes - 1)) * size;
          const x1 = cxp + ux * half;
          const y1 = cyp + uy * half;
          const ang = Math.atan2(uy, ux);
          ctx.beginPath();
          ctx.moveTo(cxp - ux * half, cyp - uy * half);
          ctx.lineTo(x1, y1);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - 4 * Math.cos(ang - 0.5), y1 - 4 * Math.sin(ang - 0.5));
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - 4 * Math.cos(ang + 0.5), y1 - 4 * Math.sin(ang + 0.5));
          ctx.strokeStyle = 'rgba(251, 245, 221, 0.75)';
          ctx.stroke();
        }
      }
    }

    const maxQ = charges.reduce((mx, c) => Math.max(mx, Math.abs(c.q)), 0) || 1;
    for (const c of charges) {
      const x = px(c.x);
      const y = py(c.y);
      const radius = 5 + 3 * (Math.abs(c.q) / maxQ);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      if (c.q === 0) {
        // A charge momentarily at zero: mark where it sits without implying a sign.
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(251, 245, 221, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }
      ctx.fillStyle = c.q > 0 ? '#DDA853' : '#A6CDC6';
      ctx.fill();
      ctx.strokeStyle = '#16404D';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const g = radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - g, y);
      ctx.lineTo(x + g, y);
      if (c.q > 0) {
        ctx.moveTo(x, y - g);
        ctx.lineTo(x, y + g);
      }
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    if (probe) {
      const x = px(probe.x);
      const y = py(probe.y);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#E54B4B';
      ctx.lineWidth = 2;
      ctx.stroke();

      const m = probeField ? Math.hypot(probeField.ex, probeField.ey) : 0;
      if (probeField && m > 0 && Number.isFinite(m)) {
        const ux = probeField.ex / m;
        const uy = -probeField.ey / m;
        const x0 = x + ux * 6;
        const y0 = y + uy * 6;
        const x1 = x + ux * 28;
        const y1 = y + uy * 28;
        const ang = Math.atan2(uy, ux);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 6 * Math.cos(ang - 0.45), y1 - 6 * Math.sin(ang - 0.45));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 6 * Math.cos(ang + 0.45), y1 - 6 * Math.sin(ang + 0.45));
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [magnitude, gridRes, referenceField, width, height, charges, fieldLines, arrows, plateY, probe, probeField]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
