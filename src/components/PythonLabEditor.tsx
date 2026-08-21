import React, { useState, useEffect } from 'react';
import { AudienceTier, PhysicsDomain, SimulationParams, TrajectoryPoint } from '../types';
import { Terminal, Play, RotateCcw, Download, Sparkles, AlertCircle, CheckCircle2, Sliders, Code2 } from 'lucide-react';

interface PythonLabEditorProps {
  activeDomain: PhysicsDomain;
  activeTier: AudienceTier;
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onRunSimulation: (customCode: string) => void;
  onResetParams: () => void;
  isPyodideReady: boolean;
  isExecuting: boolean;
  errorMessage: string;
  onExportCSV: () => void;
  initialCodeOverride?: string;
}

export const PythonLabEditor: React.FC<PythonLabEditorProps> = ({
  activeDomain,
  activeTier,
  params,
  setParams,
  onRunSimulation,
  onResetParams,
  isPyodideReady,
  isExecuting,
  errorMessage,
  onExportCSV,
  initialCodeOverride,
}) => {
  const getDefaultCodeForTier = () => {
    if (initialCodeOverride) return initialCodeOverride;

    if (activeTier === 'highschool') {
      return `# High School Level: Free Fall Simulation
# Edit acceleration function parameters below:
def acceleration(y, v):
    g = ${params.gravity.toFixed(2)}        # Gravity (m/s^2)
    drag = ${params.dragCoefficient.toFixed(2)}     # Air drag coefficient (try 0.05 or 0.2)
    return -g - drag * v * abs(v)`;
    } else if (activeTier === 'undergrad') {
      return `# Undergraduate Level: Quadratic Drag & RK4 Integration
def acceleration(y, v):
    g = ${params.gravity.toFixed(2)}        # Acceleration due to gravity
    b = ${params.dragCoefficient.toFixed(2)}     # Quadratic drag coefficient (kg/m)
    m = ${params.mass.toFixed(2)}     # Mass of falling projectile (kg)
    return -g - (b / m) * v * abs(v)`;
    } else {
      return `# Researcher Level: Stochastic Wind Forces & Atmospheric Scale Height
import math

def acceleration(y, v):
    G_earth = ${params.gravity.toFixed(2)}
    mass = ${params.mass.toFixed(2)}
    
    # Altitude-dependent atmospheric density (scale height H = 8500m)
    rho_0 = 1.225
    H_scale = 8500.0
    rho = rho_0 * math.exp(-max(y, 0) / H_scale)
    
    # Quadratic aerodynamic drag force
    Cd = ${params.dragCoefficient.toFixed(2)}
    f_drag = 0.5 * rho * Cd * v * abs(v)
    
    return -G_earth - (f_drag / mass)`;
    }
  };

  const [code, setCode] = useState<string>(getDefaultCodeForTier());

  useEffect(() => {
    if (initialCodeOverride) {
      setCode(initialCodeOverride);
    } else {
      setCode(getDefaultCodeForTier());
    }
  }, [activeTier, activeDomain, initialCodeOverride]);

  return (
    <div className="bg-cream-card border border-sage rounded-xl shadow-lg overflow-hidden flex flex-col">
      {/* Editor Header Bar */}
      <div className="bg-deepteal px-4 py-3 border-b border-sage/40 flex flex-wrap items-center justify-between gap-2 text-cream">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gold" />
          <span className="font-mono text-xs font-bold text-cream uppercase tracking-wider">
            acceleration.py
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-deepteal-dark border border-sage/30 text-gold font-medium">
            Python 3.11 (Pyodide)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-sage-light hidden sm:inline">Tier:</span>
          <span className="font-bold text-deepteal bg-gold uppercase px-2 py-0.5 rounded border border-gold">
            {activeTier}
          </span>
        </div>
      </div>

      {/* Main Grid: Code Editor on Left, Parameter Sliders on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-sage/40">
        
        {/* Python Code Textarea */}
        <div className="lg:col-span-7 p-4 flex flex-col justify-between space-y-3 bg-deepteal-dark">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-sage-light mb-1">
              <span>Write custom Python logic:</span>
              <span className="text-[10px] text-gold font-medium">Auto-compiled in browser</span>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-56 font-mono text-xs bg-deepteal border border-sage/40 rounded-lg p-3 text-cream focus:outline-none focus:ring-2 focus:ring-gold shadow-inner resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Execution Error Console */}
          {errorMessage && (
            <div className="bg-red-950/60 border border-red-800/80 text-red-300 p-2.5 rounded-lg text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="overflow-x-auto">
                <span className="font-bold block text-red-200">Execution Error:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onRunSimulation(code)}
              disabled={isExecuting}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded font-mono text-xs font-bold shadow-sm transition-transform active:scale-98 ${
                isExecuting
                  ? 'bg-deepteal text-sage-light/50 cursor-wait'
                  : 'bg-gold hover:bg-gold-hover text-deepteal'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecuting ? 'Executing Python...' : 'Run Python Simulation'}</span>
            </button>

            <button
              onClick={() => {
                setCode(getDefaultCodeForTier());
                onResetParams();
              }}
              className="flex items-center gap-1.5 py-2.5 px-3 bg-deepteal hover:bg-deepteal-soft text-cream font-mono text-xs rounded border border-sage/40 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Code</span>
            </button>

            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 py-2.5 px-3 bg-deepteal hover:bg-deepteal-soft text-cream font-mono text-xs rounded border border-sage/40 transition-all"
              title="Export numerical trajectory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Physics Parameter Controls */}
        <div className="lg:col-span-5 p-4 bg-cream-card space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-sage text-deepteal">
            <Sliders className="w-4 h-4 text-deepteal" />
            <span className="font-bold uppercase tracking-wider text-xs">
              Simulation Parameters
            </span>
          </div>

          <div className="space-y-3">
            {/* Gravity */}
            <div>
              <div className="flex justify-between text-deepteal-soft mb-1">
                <span>Gravity (g):</span>
                <span className="font-bold text-deepteal">{params.gravity.toFixed(2)} m/s²</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.1"
                value={params.gravity}
                onChange={(e) => setParams({ ...params, gravity: parseFloat(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {/* Initial Height */}
            <div>
              <div className="flex justify-between text-deepteal-soft mb-1">
                <span>Initial Height (y₀):</span>
                <span className="font-bold text-deepteal">{params.initialHeight.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={params.initialHeight}
                onChange={(e) => setParams({ ...params, initialHeight: parseFloat(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {/* Drag Coefficient */}
            <div>
              <div className="flex justify-between text-deepteal-soft mb-1">
                <span>Air Drag Coefficient (C_d):</span>
                <span className="font-bold text-deepteal">{params.dragCoefficient.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.01"
                value={params.dragCoefficient}
                onChange={(e) => setParams({ ...params, dragCoefficient: parseFloat(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {/* Mass */}
            <div>
              <div className="flex justify-between text-deepteal-soft mb-1">
                <span>Projectile Mass (m):</span>
                <span className="font-bold text-deepteal">{params.mass.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.5"
                value={params.mass}
                onChange={(e) => setParams({ ...params, mass: parseFloat(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {/* Time Step dt */}
            <div>
              <div className="flex justify-between text-deepteal-soft mb-1">
                <span>Time Step (Δt):</span>
                <span className="font-bold text-deepteal">{params.dt.toFixed(3)} s</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.1"
                step="0.005"
                value={params.dt}
                onChange={(e) => setParams({ ...params, dt: parseFloat(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {/* Numerical Method */}
            <div>
              <span className="text-deepteal-soft block mb-1">Integration Scheme:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setParams({ ...params, method: 'euler' })}
                  className={`py-1 px-2 rounded border text-[11px] ${
                    params.method === 'euler'
                      ? 'bg-gold text-deepteal border-gold font-bold'
                      : 'bg-cream text-deepteal border-sage'
                  }`}
                >
                  Euler
                </button>
                <button
                  onClick={() => setParams({ ...params, method: 'eulercromer' })}
                  className={`py-1 px-2 rounded border text-[11px] ${
                    params.method === 'eulercromer'
                      ? 'bg-gold text-deepteal border-gold font-bold'
                      : 'bg-cream text-deepteal border-sage'
                  }`}
                >
                  Euler-Cromer
                </button>
                <button
                  onClick={() => setParams({ ...params, method: 'rk4' })}
                  className={`py-1 px-2 rounded border text-[11px] ${
                    params.method === 'rk4'
                      ? 'bg-gold text-deepteal border-gold font-bold'
                      : 'bg-cream text-deepteal border-sage'
                  }`}
                >
                  RK4 (4th Order)
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
