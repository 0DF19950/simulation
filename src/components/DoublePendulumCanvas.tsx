import React, { useEffect, useRef } from 'react';

interface Bob {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DoublePendulumCanvasProps {
  points: Bob[];
  /** A second pendulum to overlay in red, for the sensitivity-to-initial-conditions demo. */
  twinPoints?: Bob[];
  maxReach: number; // l1 + l2, used to size the view
  stepIndex: number;
  trailLength?: number;
  label?: string;
}

const TRAIL_DEFAULT = 400;

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  points: Bob[],
  stepIndex: number,
  trailLength: number,
  px: (x: number) => number,
  py: (y: number) => number,
  rodColor: string,
  bobColor: string,
  trailColor: string
) {
  const now = points[Math.min(stepIndex, points.length - 1)];
  if (!now) return;

  // Fading trail of the lower bob
  const start = Math.max(0, stepIndex - trailLength);
  ctx.beginPath();
  for (let i = start; i <= stepIndex && i < points.length; i++) {
    const p = points[i];
    if (i === start) ctx.moveTo(px(p.x2), py(p.y2));
    else ctx.lineTo(px(p.x2), py(p.y2));
  }
  ctx.strokeStyle = trailColor;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Rods
  const pivotX = px(0);
  const pivotY = py(0);
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(px(now.x1), py(now.y1));
  ctx.lineTo(px(now.x2), py(now.y2));
  ctx.strokeStyle = rodColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bobs
  ctx.beginPath();
  ctx.arc(px(now.x1), py(now.y1), 4, 0, Math.PI * 2);
  ctx.fillStyle = rodColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px(now.x2), py(now.y2), 5.5, 0, Math.PI * 2);
  ctx.fillStyle = bobColor;
  ctx.fill();
}

/** Pivot-centered view of a swinging double pendulum. Shared by the simulator and the Python lab. */
export const DoublePendulumCanvas: React.FC<DoublePendulumCanvasProps> = ({
  points,
  twinPoints,
  maxReach,
  stepIndex,
  trailLength = TRAIL_DEFAULT,
  label = 'Double pendulum trajectory',
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

    const span = Math.max(maxReach * 1.15, 0.5);
    const scale = size / 2 / span;
    const cx = size / 2;
    const cy = size * 0.4; // pivot sits above center so upward swings still fit
    const px = (x: number) => cx + x * scale;
    const py = (y: number) => cy - y * scale;

    // Pivot
    ctx.beginPath();
    ctx.arc(px(0), py(0), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#A6CDC6';
    ctx.fill();

    drawPendulum(ctx, points, stepIndex, trailLength, px, py, '#A6CDC6', '#DDA853', 'rgba(221, 168, 83, 0.35)');

    if (twinPoints && twinPoints.length > 0) {
      drawPendulum(ctx, twinPoints, stepIndex, trailLength, px, py, 'rgba(229, 75, 75, 0.55)', '#E54B4B', 'rgba(229, 75, 75, 0.3)');
    }
  }, [points, twinPoints, maxReach, stepIndex, trailLength]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
