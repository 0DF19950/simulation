import React, { useState } from 'react';
import { TrajectoryPoint } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Activity, Compass, Layers } from 'lucide-react';
import { MathText } from './MathFormula';

interface InteractivePlotsProps {
  points: TrajectoryPoint[];
}

export const InteractivePlots: React.FC<InteractivePlotsProps> = ({ points }) => {
  const [plotMode, setPlotMode] = useState<'height' | 'velocity' | 'phasespace' | 'energy'>('height');

  if (!points || points.length === 0) {
    return (
      <div className="bg-deepteal border border-sage/40 rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px] font-mono text-xs text-sage-light">
        <Activity className="w-8 h-8 text-gold mb-2 animate-pulse" />
        <span>No plot data available yet.</span>
        <span>Run the Python simulation above to view synchronized curves.</span>
      </div>
    );
  }

  // Downsample trajectory points for smooth charting performance
  const chartData = points.filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 80)) === 0);

  return (
    <div className="bg-deepteal border border-sage/40 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm">
      {/* Plot Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sage/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span className="font-mono text-xs font-bold text-cream uppercase">
            Synchronized Curves
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs flex-wrap">
          <button
            onClick={() => setPlotMode('height')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'height'
                ? 'bg-gold text-deepteal font-bold'
                : 'bg-deepteal-dark text-sage-light hover:text-cream border border-sage/30'
            }`}
          >
            Height y(t)
          </button>

          <button
            onClick={() => setPlotMode('velocity')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'velocity'
                ? 'bg-gold text-deepteal font-bold'
                : 'bg-deepteal-dark text-sage-light hover:text-cream border border-sage/30'
            }`}
          >
            Velocity v(t)
          </button>

          <button
            onClick={() => setPlotMode('phasespace')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'phasespace'
                ? 'bg-gold text-deepteal font-bold'
                : 'bg-deepteal-dark text-sage-light hover:text-cream border border-sage/30'
            }`}
          >
            Phase Space (v vs y)
          </button>

          <button
            onClick={() => setPlotMode('energy')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'energy'
                ? 'bg-gold text-deepteal font-bold'
                : 'bg-deepteal-dark text-sage-light hover:text-cream border border-sage/30'
            }`}
          >
            Energy (Ek/Ep)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[210px] w-full bg-deepteal-dark rounded-lg p-2 border border-sage/40 shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          {plotMode === 'height' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#285A6A" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="s" />
              <YAxis tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="m" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E2B34', borderColor: '#A6CDC6', color: '#FBF5DD', fontSize: '11px', borderRadius: '6px' }}
                formatter={(val: any) => [`${Number(val).toFixed(2)} m`, 'Height']}
                labelFormatter={(t: any) => `Time: ${Number(t).toFixed(2)}s`}
              />
              <Line type="monotone" dataKey="y" stroke="#DDA853" strokeWidth={2.5} dot={false} name="Height y(t)" />
            </LineChart>
          ) : plotMode === 'velocity' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#285A6A" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="s" />
              <YAxis tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="m/s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E2B34', borderColor: '#A6CDC6', color: '#FBF5DD', fontSize: '11px', borderRadius: '6px' }}
                formatter={(val: any) => [`${Number(val).toFixed(2)} m/s`, 'Velocity']}
                labelFormatter={(t: any) => `Time: ${Number(t).toFixed(2)}s`}
              />
              <Line type="monotone" dataKey="v" stroke="#A6CDC6" strokeWidth={2.5} dot={false} name="Velocity v(t)" />
            </LineChart>
          ) : plotMode === 'phasespace' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#285A6A" />
              <XAxis dataKey="y" tick={{ fontSize: 10, fill: '#A6CDC6' }} name="Height y" unit="m" />
              <YAxis dataKey="v" tick={{ fontSize: 10, fill: '#A6CDC6' }} name="Velocity v" unit="m/s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E2B34', borderColor: '#A6CDC6', color: '#FBF5DD', fontSize: '11px', borderRadius: '6px' }}
                formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}`, name === 'v' ? 'Velocity v' : 'Height y']}
              />
              <Line type="monotone" dataKey="v" stroke="#DDA853" strokeWidth={2.5} dot={false} name="Phase Portrait (v vs y)" />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#285A6A" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="s" />
              <YAxis tick={{ fontSize: 10, fill: '#A6CDC6' }} unit="J" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E2B34', borderColor: '#A6CDC6', color: '#FBF5DD', fontSize: '11px', borderRadius: '6px' }}
                formatter={(val: any) => [`${Number(val).toFixed(1)} J`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#A6CDC6' }} />
              <Line type="monotone" dataKey="ek" stroke="#E54B4B" strokeWidth={2} dot={false} name="Kinetic (Ek)" />
              <Line type="monotone" dataKey="ep" stroke="#A6CDC6" strokeWidth={2} dot={false} name="Potential (Ep)" />
              <Line type="monotone" dataKey="etotal" stroke="#DDA853" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Total (E)" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-sage-light/80">
        <span>Plotting {points.length} integration steps</span>
        <MathText text={`Resolution: $\\Delta t = ${points[1] ? (points[1].t - points[0].t).toFixed(3) : '0.020'}s$`} />
      </div>
    </div>
  );
};
