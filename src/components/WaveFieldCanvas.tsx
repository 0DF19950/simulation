import React, { useEffect, useRef } from 'react';

interface SourceMarker {
  x: number;
  y: number;
}

interface WaveFieldCanvasProps {
  values: Float32Array;
  gridRes: number;
  maxAmplitude: number;
  width: number; // domain width, m — used only to place source markers correctly
  height: number; // domain height, m
  sources?: SourceMarker[];
  probe?: SourceMarker;
  label?: string;
}

// Diverging colormap: trough (teal) → dark background → crest (gold).
function colorFor(normalized: number): [number, number, number] {
  const t = Math.max(-1, Math.min(1, normalized));
  const bg: [number, number, number] = [14, 43, 52]; // #0E2B34
  const trough: [number, number, number] = [166, 205, 198]; // #A6CDC6
  const crest: [number, number, number] = [221, 168, 83]; // #DDA853
  const mix = (a: [number, number, number], b: [number, number, number], f: number): [number, number, number] => [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
  return t >= 0 ? mix(bg, crest, t) : mix(bg, trough, -t);
}

/** Pure heatmap renderer for a wave field snapshot. Shared by the live simulator and the Python lab. */
export const WaveFieldCanvas: React.FC<WaveFieldCanvasProps> = ({
  values,
  gridRes,
  maxAmplitude,
  width,
  height,
  sources = [],
  probe,
  label = 'Wave interference pattern',
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
      for (let i = 0; i < gridRes; i++) {
        const v = values[j * gridRes + i] / maxAmplitude;
        const [r, g, b] = colorFor(v);
        // Flip vertically: grid row 0 is y=0 (bottom of the domain), canvas row 0 is the top.
        const outRow = gridRes - 1 - j;
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

    sources.forEach((s) => {
      ctx.beginPath();
      ctx.arc(px(s.x), py(s.y), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FBF5DD';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#16404D';
      ctx.stroke();
    });

    if (probe) {
      ctx.beginPath();
      ctx.arc(px(probe.x), py(probe.y), 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#E54B4B';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [values, gridRes, maxAmplitude, width, height, sources, probe]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border border-sage/60"
      role="img"
      aria-label={label}
    />
  );
};
