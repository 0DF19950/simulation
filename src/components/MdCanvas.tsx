import React, { useEffect, useRef, useState } from 'react';

/** The square of space to draw, nm: centred on (cx, cy), `half` from the centre to each edge. */
export interface MdView {
  cx: number;
  cy: number;
  half: number;
}

interface MdCanvasProps {
  /** positions[(frame * n + i) * 2] is atom i's x in nm, the next entry its y. */
  positions: ArrayLike<number>;
  n: number;
  frame: number;
  /** Atoms are drawn σ across, so neighbours at r_min nearly touch. */
  sigma: number;
  view: MdView;
  /** One colour per atom, or one for all. */
  colors: string[];
  /** A twin run with the same layout, drawn as dashed outlines. */
  ghost?: ArrayLike<number> | null;
  /** Walls around a square box from 0 to `box` nm. */
  box?: number;
  /** Draws a bond between atoms closer than this, nm. */
  bondLength?: number;
  /** Atoms drawn in a muted tone, e.g. the ones that have broken away. */
  muted?: boolean[] | null;
  labels?: string[];
  /** Frames of trail behind each atom. */
  trailFrames?: number;
  caption?: string;
  label: string;
}

const SURFACE = '#0E2B34';
const MUTED = 'rgba(166, 205, 198, 0.5)';
const SCALE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5]; // nm

function withAlpha(hex: string, alpha: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

export const MdCanvas: React.FC<MdCanvasProps> = ({
  positions,
  n,
  frame,
  sigma,
  view,
  colors,
  ghost,
  box,
  bondLength,
  muted,
  labels,
  trailFrames,
  caption,
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
    const size = canvas.clientWidth;
    if (size === 0) return;
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, size, size);

    const frames = n > 0 ? Math.floor(positions.length / (2 * n)) : 0;
    if (frames === 0) return;
    const f = Math.max(0, Math.min(frame, frames - 1));
    const scale = size / (2 * view.half);
    const sx = (x: number) => size / 2 + (x - view.cx) * scale;
    const sy = (y: number) => size / 2 - (y - view.cy) * scale;
    const colorOf = (i: number) => colors[i % colors.length];
    const radius = Math.max(2.5, 0.5 * sigma * scale);

    if (box !== undefined) {
      ctx.strokeStyle = 'rgba(166, 205, 198, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx(0), sy(box), box * scale, box * scale);
    }

    if (bondLength) {
      const limit = bondLength * bondLength;
      ctx.strokeStyle = 'rgba(166, 205, 198, 0.3)';
      ctx.lineWidth = Math.max(1, 0.1 * sigma * scale);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const xi = positions[(f * n + i) * 2];
        const yi = positions[(f * n + i) * 2 + 1];
        for (let j = i + 1; j < n; j++) {
          const xj = positions[(f * n + j) * 2];
          const yj = positions[(f * n + j) * 2 + 1];
          if ((xi - xj) ** 2 + (yi - yj) ** 2 < limit) {
            ctx.moveTo(sx(xi), sy(yi));
            ctx.lineTo(sx(xj), sy(yj));
          }
        }
      }
      ctx.stroke();
    }

    if (trailFrames) {
      ctx.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const first = Math.max(0, f - trailFrames);
        ctx.beginPath();
        for (let k = first; k <= f; k++) {
          const X = sx(positions[(k * n + i) * 2]);
          const Y = sy(positions[(k * n + i) * 2 + 1]);
          if (k === first) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.strokeStyle = withAlpha(colorOf(i), 0.35);
        ctx.stroke();
      }
    }

    if (ghost) {
      const gf = Math.min(f, Math.floor(ghost.length / (2 * n)) - 1);
      if (gf >= 0) {
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          ctx.arc(sx(ghost[(gf * n + i) * 2]), sy(ghost[(gf * n + i) * 2 + 1]), radius, 0, Math.PI * 2);
          ctx.strokeStyle = withAlpha(colorOf(i), 0.9);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    for (let i = 0; i < n; i++) {
      const X = sx(positions[(f * n + i) * 2]);
      const Y = sy(positions[(f * n + i) * 2 + 1]);
      if (X < -radius || X > size + radius || Y < -radius || Y > size + radius) continue;
      ctx.beginPath();
      ctx.arc(X, Y, radius, 0, Math.PI * 2);
      ctx.fillStyle = muted?.[i] ? MUTED : colorOf(i);
      ctx.fill();
      if (radius >= 5) {
        ctx.beginPath();
        ctx.arc(X - radius * 0.32, Y - radius * 0.32, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fill();
      }
      if (labels?.[i] && radius >= 7) {
        ctx.fillStyle = SURFACE;
        ctx.font = `bold ${Math.round(Math.min(13, radius))}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], X, Y + 0.5);
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '10px "JetBrains Mono", monospace';
    const target = (size * 0.22) / scale;
    const bar = SCALE_STEPS.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best));
    const bx = 12;
    const by = size - 14;
    ctx.strokeStyle = 'rgba(251, 245, 221, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bar * scale, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + bar * scale, by - 4);
    ctx.lineTo(bx + bar * scale, by + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 245, 221, 0.85)';
    ctx.fillText(`${bar} nm`, bx + bar * scale + 6, by + 3);
    if (caption) ctx.fillText(caption, 12, 18);
  }, [positions, n, frame, sigma, view.cx, view.cy, view.half, colors, ghost, box, bondLength, muted, labels, trailFrames, caption, resized]);

  return <canvas ref={canvasRef} className="w-full aspect-square rounded-lg border border-sage/60" role="img" aria-label={label} />;
};
