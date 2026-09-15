import React, { useEffect, useRef, useState } from 'react';

export interface WaveTrace {
  /** |ψ|² at each grid point for this frame, nm⁻¹. */
  density: ArrayLike<number>;
  color: string;
}

interface TunnelingCanvasProps {
  /** Grid cell centres, nm. */
  x: ArrayLike<number>;
  /** Potential energy at each grid point for this frame, eV. */
  potential: ArrayLike<number>;
  traces: WaveTrace[];
  /** The packet's energy, eV: the waves are drawn sitting on this line. */
  energy: number;
  /** Density that fills the full wave height, so the scale holds still through a run. */
  peak: number;
  /** Visible x range, nm. */
  view: [number, number];
  /** Top of the energy axis, eV. */
  energyMax: number;
  caption?: string;
  leftNote?: string;
  rightNote?: string;
  label: string;
}

const SURFACE = '#0E2B34';
const INK = 'rgba(251, 245, 221, 0.85)';
const FAINT = 'rgba(166, 205, 198, 0.16)';

function withAlpha(hex: string, alpha: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

export const TunnelingCanvas: React.FC<TunnelingCanvasProps> = ({
  x,
  potential,
  traces,
  energy,
  peak,
  view,
  energyMax,
  caption,
  leftNote,
  rightNote,
  label,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resized, setResized] = useState(0);

  // Redraw when the layout changes size, even while playback is paused.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setResized((k) => k + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, w, h);

    const left = 48;
    const right = w - 12;
    const top = 26;
    const bottom = h - 24;
    const px = (v: number) => left + ((v - view[0]) / (view[1] - view[0])) * (right - left);
    const py = (e: number) => bottom - (e / energyMax) * (bottom - top);
    const n = x.length;

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.lineWidth = 1;

    // Energy grid and axis labels.
    const eStep = energyMax > 1.6 ? 0.5 : energyMax > 0.8 ? 0.25 : 0.1;
    ctx.textAlign = 'right';
    for (let e = 0; e <= energyMax + 1e-9; e += eStep) {
      ctx.strokeStyle = FAINT;
      ctx.beginPath();
      ctx.moveTo(left, py(e));
      ctx.lineTo(right, py(e));
      ctx.stroke();
      ctx.fillStyle = 'rgba(166, 205, 198, 0.7)';
      ctx.fillText(`${Number(e.toFixed(2))}`, left - 6, py(e) + 3);
    }
    ctx.save();
    ctx.translate(12, (top + bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('energy (eV)', 0, 0);
    ctx.restore();

    // Position ticks, leaving room for the axis name at the right.
    const span = view[1] - view[0];
    const xStep = span > 60 ? 10 : span > 24 ? 5 : 2;
    const nameLeft = right - ctx.measureText('x (nm)').width - 8;
    ctx.fillStyle = 'rgba(166, 205, 198, 0.7)';
    ctx.textAlign = 'center';
    for (let v = Math.ceil(view[0] / xStep) * xStep; v <= view[1]; v += xStep) {
      const tick = `${v}`;
      if (px(v) + ctx.measureText(tick).width / 2 > nameLeft) continue;
      ctx.fillText(tick, px(v), h - 8);
    }
    ctx.textAlign = 'right';
    ctx.fillText('x (nm)', right, h - 8);

    // The potential, filled up from zero.
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      if (x[i] < view[0] || x[i] > view[1]) continue;
      const X = px(x[i]);
      const Y = py(Math.max(0, Math.min(energyMax, potential[i])));
      if (!started) {
        ctx.moveTo(X, py(0));
        started = true;
      }
      ctx.lineTo(X, Y);
    }
    if (started) {
      ctx.lineTo(right, py(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(166, 205, 198, 0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(166, 205, 198, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // The particle's energy, and the waves sitting on it.
    const base = py(Math.min(energy, energyMax));
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(221, 168, 83, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, base);
    ctx.lineTo(right, base);
    ctx.stroke();
    ctx.setLineDash([]);

    const waveHeight = Math.min(base - top, (bottom - top) * 0.55);
    for (const trace of traces) {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < n; i++) {
        if (x[i] < view[0] || x[i] > view[1]) continue;
        const X = px(x[i]);
        const Y = base - Math.min(1.2, trace.density[i] / Math.max(peak, 1e-12)) * waveHeight;
        if (first) {
          ctx.moveTo(X, base);
          first = false;
        }
        ctx.lineTo(X, Y);
      }
      ctx.lineTo(right, base);
      ctx.closePath();
      ctx.fillStyle = withAlpha(trace.color, 0.3);
      ctx.fill();
      ctx.strokeStyle = trace.color;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    if (caption) ctx.fillText(caption, left, 15);
    if (leftNote) ctx.fillText(leftNote, left + 4, top + 12);
    if (rightNote) {
      ctx.textAlign = 'right';
      ctx.fillText(rightNote, right - 4, top + 12);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(221, 168, 83, 0.85)';
    ctx.fillText(`E = ${energy.toFixed(2)} eV`, left + 4, base - 5);
  }, [x, potential, traces, energy, peak, view, energyMax, caption, leftNote, rightNote, resized]);

  return <canvas ref={canvasRef} className="w-full aspect-[5/2] min-h-[190px] rounded-lg border border-sage/60" role="img" aria-label={label} />;
};
