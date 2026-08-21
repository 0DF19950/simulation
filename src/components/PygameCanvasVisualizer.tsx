import React, { useEffect, useRef, useState } from 'react';
import { PhysicsDomain, SimulationParams, TrajectoryPoint } from '../types';
import { Play, Pause, SkipForward, RotateCcw, Activity, Eye, Zap } from 'lucide-react';

interface PygameCanvasVisualizerProps {
  domain: PhysicsDomain;
  params: SimulationParams;
  points: TrajectoryPoint[];
  currentStepIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onReset: () => void;
}

export const PygameCanvasVisualizer: React.FC<PygameCanvasVisualizerProps> = ({
  domain,
  params,
  points,
  currentStepIndex,
  setCurrentStepIndex,
  isPlaying,
  setIsPlaying,
  onReset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const currentPoint = points[currentStepIndex] || points[0] || {
    t: 0,
    y: params.initialHeight,
    v: params.initialVelocity,
    a: -params.gravity,
    ek: 0,
    ep: params.mass * params.gravity * params.initialHeight,
    etotal: params.mass * params.gravity * params.initialHeight,
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear background
    ctx.fillStyle = '#0E2B34'; // Deepteal-dark
    ctx.fillRect(0, 0, W, H);

    // Subtle grid overlay
    ctx.strokeStyle = '#285A6A';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Pygame Header Banner overlay
    ctx.fillStyle = 'rgba(22, 64, 77, 0.95)';
    ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = '#DDA853';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`[Pygame 2.5 Window] Domain: ${domain.toUpperCase()} | Method: ${params.method.toUpperCase()}`, 10, 17);

    if (!points || points.length === 0) {
      ctx.fillStyle = '#DDA853';
      ctx.fillText('Press "Run Simulation" to render trajectory', W / 2 - 120, H / 2);
      return;
    }

    // Domain-Specific Graphical Rendering
    if (domain === 'classical') {
      // 1. Classical Physics: Vertical Falling Body or Pendulum
      if (params.pendulumLength && params.pendulumLength > 0) {
        // Draw Pendulum
        const pivotX = W / 2;
        const pivotY = 70;
        const L = 100; // visual length
        const theta = (currentPoint.y * Math.PI) / 180; // theta in radians

        const bobX = pivotX + L * Math.sin(theta);
        const bobY = pivotY + L * Math.cos(theta);

        // Pivot Stand
        ctx.fillStyle = '#DDA853';
        ctx.fillRect(pivotX - 15, pivotY - 6, 30, 6);

        // String
        ctx.strokeStyle = '#A6CDC6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Trajectory arc trail
        ctx.strokeStyle = 'rgba(221, 168, 83, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= currentStepIndex; i++) {
          const ptTheta = (points[i].y * Math.PI) / 180;
          const px = pivotX + L * Math.sin(ptTheta);
          const py = pivotY + L * Math.cos(ptTheta);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Bob
        ctx.fillStyle = '#DDA853';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FBF5DD';
        ctx.lineWidth = 1.5;
        ctx.stroke();

      } else {
        // Standard Falling Ball Visualization
        const groundY = H - 25;
        const topY = 40;
        const maxH = Math.max(params.initialHeight, 1.0);
        const clampedY = Math.min(Math.max(currentPoint.y, 0), maxH);
        const ballY = topY + (1 - clampedY / maxH) * (groundY - topY);
        const ballX = W / 2;

        // Ground platform
        ctx.fillStyle = '#16404D';
        ctx.fillRect(0, groundY, W, 25);
        ctx.fillStyle = '#DDA853';
        ctx.fillRect(0, groundY, W, 2);

        // Trajectory trail line
        ctx.strokeStyle = 'rgba(221, 168, 83, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= currentStepIndex; i++) {
          const py = topY + (1 - Math.max(points[i].y, 0) / maxH) * (groundY - topY);
          if (i === 0) ctx.moveTo(ballX, py);
          else ctx.lineTo(ballX, py);
        }
        ctx.stroke();

        // Velocity Arrow
        if (Math.abs(currentPoint.v) > 0.1) {
          const arrowLen = Math.min(Math.abs(currentPoint.v) * 1.2, 40);
          const dir = currentPoint.v < 0 ? 1 : -1;
          ctx.strokeStyle = '#A6CDC6';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(ballX, ballY);
          ctx.lineTo(ballX, ballY + dir * arrowLen);
          ctx.stroke();

          // Arrowhead
          ctx.fillStyle = '#A6CDC6';
          ctx.beginPath();
          ctx.arc(ballX, ballY + dir * arrowLen, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Air drag particles if drag > 0
        if (params.dragCoefficient > 0 && currentPoint.v < -1) {
          ctx.fillStyle = 'rgba(166, 205, 198, 0.4)';
          for (let p = 0; p < 5; p++) {
            const px = ballX + (Math.random() - 0.5) * 20;
            const py = ballY - Math.random() * 25;
            ctx.fillRect(px, py, 2, 2);
          }
        }

        // Ball
        ctx.fillStyle = '#DDA853';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FBF5DD';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

    } else if (domain === 'waves') {
      // 2. Waves & Fields: Stretched String / Wavepacket
      const centerY = H / 2 + 10;
      const numNodes = 40;
      const t = currentPoint.t;

      ctx.strokeStyle = '#A6CDC6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let i = 0; i <= numNodes; i++) {
        const x = (i / numNodes) * (W - 40) + 20;
        const waveSpeed = params.waveSpeed || 3.0;
        const damp = params.damping || 0.01;
        const amp = 30 * Math.sin((i / 5) - waveSpeed * t) * Math.exp(-damp * t);
        const y = centerY - amp;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        // Nodes
        ctx.fillStyle = '#DDA853';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      ctx.stroke();

    } else if (domain === 'modern') {
      // 3. Modern Physics: Quantum Wavefunction Probability Density
      const centerY = H / 2 + 20;
      const numPoints = 60;
      const t = currentPoint.t;

      // Potential Barrier
      ctx.fillStyle = 'rgba(221, 168, 83, 0.2)';
      ctx.fillRect(W * 0.45, 50, W * 0.1, H - 90);
      ctx.strokeStyle = '#DDA853';
      ctx.strokeRect(W * 0.45, 50, W * 0.1, H - 90);

      // Wavefunction |psi(x)|^2
      ctx.strokeStyle = '#A6CDC6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let i = 0; i <= numPoints; i++) {
        const xRatio = i / numPoints;
        const x = xRatio * (W - 40) + 20;
        // Gaussian envelope propagating towards barrier
        const xCenter = 0.25 + 0.3 * (t % 3);
        const gaussian = Math.exp(-Math.pow((xRatio - xCenter) / 0.08, 2));
        const psiSq = 60 * gaussian * Math.pow(Math.cos(15 * xRatio - 5 * t), 2);
        const y = centerY - psiSq;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

  }, [domain, params, points, currentStepIndex]);

  // Animation playback controller
  useEffect(() => {
    if (isPlaying && points.length > 0) {
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= points.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 20 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isPlaying, points, playbackSpeed, setCurrentStepIndex, setIsPlaying]);

  return (
    <div className="bg-deepteal border border-sage/40 rounded-xl p-4 flex flex-col justify-between space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gold" />
          <span className="font-mono text-xs font-bold text-cream uppercase">
            Pygame Graphical View
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setPlaybackSpeed(0.5)}
            className={`px-2 py-0.5 rounded ${playbackSpeed === 0.5 ? 'bg-gold text-deepteal font-bold' : 'bg-deepteal-dark text-sage-light border border-sage/30'}`}
          >
            0.5x
          </button>
          <button
            onClick={() => setPlaybackSpeed(1)}
            className={`px-2 py-0.5 rounded ${playbackSpeed === 1 ? 'bg-gold text-deepteal font-bold' : 'bg-deepteal-dark text-sage-light border border-sage/30'}`}
          >
            1x
          </button>
          <button
            onClick={() => setPlaybackSpeed(2)}
            className={`px-2 py-0.5 rounded ${playbackSpeed === 2 ? 'bg-gold text-deepteal font-bold' : 'bg-deepteal-dark text-sage-light border border-sage/30'}`}
          >
            2x
          </button>
        </div>
      </div>

      {/* Main Canvas View */}
      <div className="relative flex justify-center bg-deepteal-dark rounded-lg overflow-hidden border border-sage/40 shadow-inner">
        <canvas
          ref={canvasRef}
          width={420}
          height={210}
          className="w-full h-auto max-h-[220px] object-contain"
        />
      </div>

      {/* Telemetry Gauge Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="bg-deepteal-dark p-2 rounded-md border border-sage/30">
          <span className="text-sage-light/70 block text-[10px]">TIME (t)</span>
          <span className="font-bold text-cream">{currentPoint.t.toFixed(2)} s</span>
        </div>

        <div className="bg-deepteal-dark p-2 rounded-md border border-sage/30">
          <span className="text-sage-light/70 block text-[10px]">HEIGHT / POS</span>
          <span className="font-bold text-gold">{currentPoint.y.toFixed(2)} m</span>
        </div>

        <div className="bg-deepteal-dark p-2 rounded-md border border-sage/30">
          <span className="text-sage-light/70 block text-[10px]">VELOCITY (v)</span>
          <span className="font-bold text-cream">{currentPoint.v.toFixed(2)} m/s</span>
        </div>

        <div className="bg-deepteal-dark p-2 rounded-md border border-sage/30">
          <span className="text-sage-light/70 block text-[10px]">ACCEL / FORCING</span>
          <span className="font-bold text-sage">{(currentPoint.a || -params.gravity).toFixed(2)} m/s²</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-sage/30">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!points || points.length === 0}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded font-mono text-xs font-bold transition-all ${
            isPlaying
              ? 'bg-gold-hover text-deepteal'
              : 'bg-gold hover:bg-gold-hover text-deepteal shadow-sm'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pause' : 'Play Trajectory'}</span>
        </button>

        <button
          onClick={() => {
            if (currentStepIndex < points.length - 1) {
              setCurrentStepIndex(currentStepIndex + 1);
            }
          }}
          disabled={!points || currentStepIndex >= points.length - 1}
          className="flex items-center justify-center p-2 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 transition-all"
          title="Step Forward (+1 frame)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStepIndex(0);
            onReset();
          }}
          className="flex items-center justify-center p-2 bg-deepteal-dark hover:bg-deepteal-soft text-cream rounded border border-sage/30 transition-all"
          title="Reset to t=0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
