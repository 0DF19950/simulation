import React, { useEffect, useRef } from 'react';

interface DecayJarProps {
  jar: Uint8Array;
  jarAtoms: number;
  frame: number;
  /** Colour per member index; null draws that member as a decayed, empty atom. */
  memberColors: (string | null)[];
  surface: string;
  emptyColor: string;
  label: string;
}

/** The jar: one dot per recorded atom, coloured by the isotope it is right now. */
export const DecayJar: React.FC<DecayJarProps> = ({ jar, jarAtoms, frame, memberColors, surface, emptyColor, label }) => {
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
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, size, size);

    const cols = Math.ceil(Math.sqrt(jarAtoms));
    const rows = Math.ceil(jarAtoms / cols);
    const cell = size / cols;
    const top = (size - rows * cell) / 2;
    const radius = Math.max(1.5, cell * 0.33);
    const base = Math.max(0, frame) * jarAtoms;

    for (let a = 0; a < jarAtoms; a++) {
      const member = jar[base + a];
      ctx.beginPath();
      ctx.arc((a % cols) * cell + cell / 2, top + Math.floor(a / cols) * cell + cell / 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = memberColors[member] ?? emptyColor;
      ctx.fill();
    }
  }, [jar, jarAtoms, frame, memberColors, surface, emptyColor]);

  return <canvas ref={canvasRef} className="w-full aspect-square rounded-lg border border-sage/60" role="img" aria-label={label} />;
};
