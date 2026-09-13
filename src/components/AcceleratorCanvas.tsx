import React, { useEffect, useRef } from 'react';
import { AcceleratorRun, RF_GAP } from '../utils/acceleratorEngine';

/** The slice of a run the canvas needs, so the Python lab can supply its own. */
export type BeamFrames = Pick<AcceleratorRun, 'nParticles' | 'nFrames' | 'positions' | 'chargeSign' | 'maxExtent'>;

interface AcceleratorCanvasProps {
  run: BeamFrames;
  /** Playhead: the recorded frame to draw the dots at. */
  frame: number;
  /** Frames of trail behind each dot; omit to draw the whole path so far. */
  trailFrames?: number;
  showGap?: boolean;
  /** Draws r = mv/(qB) as a dashed circle, so the orbit can be checked by eye. */
  formulaRadius?: number;
  label?: string;
}

/** Fixed unless a path leaves it, so a stronger field visibly tightens the circle. */
const MIN_HALF_WIDTH = 0.16; // m
const SCALE_STEPS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1]; // m

export const AcceleratorCanvas: React.FC<AcceleratorCanvasProps> = ({
  run,
  frame,
  trailFrames,
  showGap = false,
  formulaRadius,
  label = 'Charged particles moving in a magnetic field',
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

    // B points out of the screen: the usual dot-in-circle symbol, tiled faintly.
    const spacing = 30;
    ctx.strokeStyle = 'rgba(166, 205, 198, 0.13)';
    ctx.fillStyle = 'rgba(166, 205, 198, 0.13)';
    ctx.lineWidth = 1;
    for (let gy = spacing / 2; gy < size; gy += spacing) {
      for (let gx = spacing / 2; gx < size; gx += spacing) {
        ctx.beginPath();
        ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const half = Math.max(MIN_HALF_WIDTH, run.maxExtent * 1.2);
    const scale = size / (2 * half);
    const px = (x: number) => size / 2 + x * scale;
    const py = (y: number) => size / 2 - y * scale;

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    if (showGap) {
      const w = Math.max(3, RF_GAP * scale);
      ctx.fillStyle = 'rgba(221, 168, 83, 0.2)';
      ctx.fillRect(size / 2 - w / 2, 0, w, size);
      ctx.fillStyle = 'rgba(221, 168, 83, 0.9)';
      ctx.fillText('RF gap', size / 2 + w / 2 + 4, size - 12);
    }

    if (formulaRadius) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(251, 245, 221, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px(0), py(0), formulaRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const n = run.nParticles;
    const last = Math.max(0, Math.min(frame, run.nFrames - 1));
    const first = trailFrames === undefined ? 0 : Math.max(0, last - trailFrames);
    const color = run.chargeSign > 0 ? '221, 168, 83' : '166, 205, 198';
    const many = n > 2;

    ctx.lineWidth = many ? 0.8 : 1.6;
    ctx.strokeStyle = `rgba(${color}, ${many ? 0.3 : 0.75})`;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      for (let f = first; f <= last; f++) {
        const k = (f * n + i) * 2;
        const X = px(run.positions[k]);
        const Y = py(run.positions[k + 1]);
        if (f === first) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const k = (last * n + i) * 2;
      ctx.beginPath();
      ctx.arc(px(run.positions[k]), py(run.positions[k + 1]), many ? 2.4 : 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${color})`;
      ctx.fill();
      if (!many) {
        ctx.strokeStyle = '#FBF5DD';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    const target = (size * 0.22) / scale;
    const barM = SCALE_STEPS.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best));
    const barPx = barM * scale;
    const bx = 12;
    const by = size - 14;
    ctx.strokeStyle = 'rgba(251, 245, 221, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barPx, by - 4);
    ctx.lineTo(bx + barPx, by + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 245, 221, 0.85)';
    ctx.fillText(barM >= 0.01 ? `${Math.round(barM * 100)} cm` : `${Math.round(barM * 1000)} mm`, bx + barPx + 6, by + 3);
    ctx.fillText('B out of the screen', 12, 16);
  }, [run, frame, trailFrames, showGap, formulaRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
