import React, { useEffect, useRef } from 'react';
import { EARTH } from '../utils/orbitalEngine';

interface Pt {
  x: number;
  y: number;
}

interface OrbitCanvasProps {
  points: Pt[];
  maxRadiusM: number;
  /** How much of the path has been traced; the satellite sits at this index. */
  stepIndex: number;
  label?: string;
}

/** Earth-centred plan view of a trajectory. Shared by the simulator and the Python lab. */
export const OrbitCanvas: React.FC<OrbitCanvasProps> = ({
  points,
  maxRadiusM,
  stepIndex,
  label = 'Orbital trajectory around Earth',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    ctx.fillStyle = '#0E2B34';
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const span = Math.max(maxRadiusM * 1.12, EARTH.radiusM * 1.6);
    const scale = size / 2 / span;
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;

    // Earth
    ctx.beginPath();
    ctx.arc(cx, cy, EARTH.radiusM * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#A6CDC6';
    ctx.fill();
    ctx.strokeStyle = '#7CA7A0';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (points.length > 1) {
      // Whole path, faint
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
      ctx.strokeStyle = 'rgba(166, 205, 198, 0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Traced so far
      ctx.beginPath();
      points
        .slice(0, stepIndex + 1)
        .forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
      ctx.strokeStyle = '#DDA853';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    const now = points[Math.min(stepIndex, points.length - 1)];
    if (now) {
      ctx.beginPath();
      ctx.arc(px(now.x), py(now.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FBF5DD';
      ctx.fill();
    }
  }, [points, maxRadiusM, stepIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
