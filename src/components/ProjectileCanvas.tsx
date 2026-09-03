import React, { useEffect, useRef } from 'react';

interface Pt {
  x: number;
  y: number;
}

interface ProjectileCanvasProps {
  points: Pt[];
  maxRange: number;
  maxHeight: number;
  /** How much of the path has been traced; the ball sits at this index. */
  stepIndex: number;
  label?: string;
}

/** Ground-level side view of a trajectory. Shared by the simulator and the Python lab. */
export const ProjectileCanvas: React.FC<ProjectileCanvasProps> = ({
  points,
  maxRange,
  maxHeight,
  stepIndex,
  label = 'Projectile trajectory',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0E2B34';
    ctx.fillRect(0, 0, width, height);

    const pad = { left: 12, right: 12, top: 16, bottom: 28 };
    const graphW = width - pad.left - pad.right;
    const graphH = height - pad.top - pad.bottom;

    const spanX = Math.max(maxRange * 1.08, 1);
    const spanY = Math.max(maxHeight * 1.25, 1);
    const px = (x: number) => pad.left + (x / spanX) * graphW;
    const py = (y: number) => height - pad.bottom - (y / spanY) * graphH;

    // Ground
    ctx.strokeStyle = '#A6CDC6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, py(0));
    ctx.lineTo(width - pad.right, py(0));
    ctx.stroke();

    // Launch marker
    ctx.beginPath();
    ctx.arc(px(0), py(0), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#A6CDC6';
    ctx.fill();

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

    ctx.fillStyle = '#A6CDC6';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`range ≈ ${maxRange.toFixed(1)} m`, pad.left, height - 10);
  }, [points, maxRange, maxHeight, stepIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-[16/9] rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
