import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export const FallingInstrumentWidget: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [telemetry, setTelemetry] = useState({
    t: 0,
    y: 50.0,
    v: 0.0,
    a: -9.81,
  });

  const animRef = useRef<number | null>(null);
  const stateRef = useRef({ y: 50.0, v: 0.0, t: 0.0, done: false });

  const drawInstrument = (yVal: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear background: Deepteal dark
    ctx.fillStyle = '#0E2B34';
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = '#285A6A';
    for (let x = 10; x < W; x += 15) {
      for (let y = 10; y < H; y += 15) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }

    // Frame border
    ctx.strokeStyle = '#285A6A';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // Altitude tick marks
    ctx.strokeStyle = '#A6CDC6';
    ctx.lineWidth = 1;
    for (let h = 10; h < 50; h += 10) {
      const lineY = 20 + (1 - h / 50) * (H - 30);
      ctx.beginPath();
      ctx.moveTo(4, lineY);
      ctx.lineTo(10, lineY);
      ctx.stroke();
    }

    // Ground line
    const groundY = H - 10;
    ctx.strokeStyle = '#DDA853';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Falling ball
    const topY = 20;
    const clampedY = Math.min(Math.max(yVal, 0), 50.0);
    const ballCanvasY = topY + (1 - clampedY / 50.0) * (groundY - topY);

    // Velocity vector line
    if (stateRef.current.v < -0.1) {
      ctx.strokeStyle = '#A6CDC6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, ballCanvasY);
      ctx.lineTo(W / 2, ballCanvasY + Math.min(Math.abs(stateRef.current.v) * 0.8, 25));
      ctx.stroke();
    }

    // Ball
    ctx.fillStyle = '#DDA853';
    ctx.beginPath();
    ctx.arc(W / 2, ballCanvasY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FBF5DD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ground impact particle flash
    if (yVal <= 0.05 && stateRef.current.done) {
      ctx.fillStyle = '#DDA853';
      for (let i = -12; i <= 12; i += 6) {
        ctx.beginPath();
        ctx.arc(W / 2 + i, groundY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const resetSimulation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    stateRef.current = { y: 50.0, v: 0.0, t: 0.0, done: false };
    setIsRunning(false);
    setTelemetry({ t: 0, y: 50.0, v: 0.0, a: -9.81 });
    drawInstrument(50.0);
  };

  const stepSimulation = () => {
    const dt = 0.02;
    const g = 9.81;

    if (!stateRef.current.done) {
      stateRef.current.v += -g * dt;
      stateRef.current.y += stateRef.current.v * dt;
      stateRef.current.t += dt;

      if (stateRef.current.y <= 0) {
        stateRef.current.y = 0;
        stateRef.current.done = true;
        setIsRunning(false);
      }

      setTelemetry({
        t: stateRef.current.t,
        y: Math.max(stateRef.current.y, 0),
        v: stateRef.current.v,
        a: -g,
      });

      drawInstrument(stateRef.current.y);

      if (!stateRef.current.done) {
        animRef.current = requestAnimationFrame(stepSimulation);
      }
    }
  };

  const startSimulation = () => {
    if (stateRef.current.done || stateRef.current.y <= 0) {
      stateRef.current = { y: 50.0, v: 0.0, t: 0.0, done: false };
    }
    setIsRunning(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(stepSimulation);
  };

  useEffect(() => {
    drawInstrument(50.0);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="bg-deepteal text-cream border border-sage/40 rounded-xl p-5 shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            Falling Body — Instrument View
          </span>
        </div>
        <span className="font-mono text-[10px] text-gold bg-deepteal-dark px-2 py-0.5 rounded border border-sage/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Visual Canvas */}
        <div className="col-span-5 flex justify-center">
          <canvas
            ref={canvasRef}
            width={110}
            height={190}
            className="bg-deepteal-dark rounded border border-sage/30 shadow-inner"
          />
        </div>

        {/* Telemetry Dashboard */}
        <div className="col-span-7 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">t (time):</span>
            <span className="font-bold text-cream">{telemetry.t.toFixed(2)} s</span>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">height (y):</span>
            <span className="font-bold text-gold">{telemetry.y.toFixed(1)} m</span>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">velocity (v):</span>
            <span className="font-bold text-cream">{telemetry.v.toFixed(2)} m/s</span>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-sage/30">
            <span className="text-sage-light">accel (g):</span>
            <span className="font-bold text-sage-light">{telemetry.a.toFixed(2)} m/s²</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sage/30">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded font-mono text-xs font-bold transition-all ${
            isRunning
              ? 'bg-deepteal-dark text-sage/50 cursor-not-allowed'
              : 'bg-gold hover:bg-gold-hover text-deepteal shadow-sm'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'Running...' : 'Run Simulation'}</span>
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 font-mono text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
