import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, Radio, RotateCcw } from 'lucide-react';
import { WaveFieldCanvas } from './WaveFieldCanvas';
import {
  Reflector,
  WaveFieldParams,
  computeFieldGrid,
  probePeakAmplitude,
  twoSourceAmplitude,
} from '../utils/waveInterferenceEngine';

const DEG = Math.PI / 180;
const WIDTH = 10;
const HEIGHT = 6;
const GRID_RES = 90;
const SOURCE1 = { x: 3.5, y: 3 };
const SOURCE2 = { x: 6.5, y: 3 };
const SOURCE3 = { x: 5, y: 5 };
const PROBE = { x: 5, y: 3 }; // equidistant from source 1 and 2

export const WaveInterferenceSimulator: React.FC = () => {
  const [amplitude, setAmplitude] = useState(0.02); // m (2 cm)
  const [frequency, setFrequency] = useState(0.6); // Hz
  const [wavelength, setWavelength] = useState(2.5); // m
  const [deltaPhiDeg, setDeltaPhiDeg] = useState(0);
  const [thirdSource, setThirdSource] = useState(false);
  const [wall, setWall] = useState(false);
  const [freqMismatch, setFreqMismatch] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [t, setT] = useState(0);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  const params: WaveFieldParams = useMemo(() => {
    const sources = [
      { x: SOURCE1.x, y: SOURCE1.y, amplitude, frequency, wavelength, phase: 0 },
      {
        x: SOURCE2.x,
        y: SOURCE2.y,
        amplitude,
        frequency: freqMismatch ? frequency * 1.15 : frequency,
        wavelength,
        phase: deltaPhiDeg * DEG,
      },
    ];
    if (thirdSource) sources.push({ x: SOURCE3.x, y: SOURCE3.y, amplitude, frequency, wavelength, phase: 0 });

    const reflectors: Reflector[] = wall ? [{ axis: 'x', position: WIDTH, reflectivity: 0.85 }] : [];

    return { sources, reflectors, width: WIDTH, height: HEIGHT };
  }, [amplitude, frequency, wavelength, deltaPhiDeg, thirdSource, wall, freqMismatch]);

  const grid = useMemo(() => computeFieldGrid(params, t, GRID_RES), [params, t]);

  const isClean = !thirdSource && !wall && !freqMismatch;
  const analyticAmplitude = twoSourceAmplitude(amplitude, deltaPhiDeg * DEG);
  const measuredAmplitude = useMemo(
    () => probePeakAmplitude(params, PROBE.x, PROBE.y),
    [params]
  );

  useEffect(() => {
    if (!isPlaying) {
      lastRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        setT((prev) => prev + dt);
      }
      lastRef.current = now;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying]);

  const sourceMarkers = params.sources.map((s) => ({ x: s.x, y: s.y }));

  return (
    <div className="bg-cream-card border border-sage rounded-xl p-5 space-y-4 shadow-xs">
      <h3 className="font-sans font-semibold text-lg text-deepteal flex items-center gap-2">
        <Radio className="w-5 h-5 text-gold-hover" />
        <span>Wave interference simulator</span>
      </h3>
      <p className="text-sm text-deepteal-soft">
        Two ripple sources, superposed at every point on a grid — the red ring marks the probe
        point in the readout below, equidistant from sources 1 and 2.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div>
          <WaveFieldCanvas
            values={grid.values}
            gridRes={grid.gridRes}
            maxAmplitude={grid.maxAmplitude}
            width={WIDTH}
            height={HEIGHT}
            sources={sourceMarkers}
            probe={PROBE}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded bg-deepteal text-cream hover:bg-deepteal-soft transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setT(0)}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded border border-sage bg-cream text-deepteal-soft hover:border-gold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
            <span className="font-mono text-[10px] text-deepteal-soft ml-auto">t = {t.toFixed(1)} s</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between text-xs font-mono mb-1">
              <span className="text-deepteal-soft">Phase difference Δφ</span>
              <span className="text-deepteal font-bold">{deltaPhiDeg.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={deltaPhiDeg}
              onChange={(e) => setDeltaPhiDeg(parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
              aria-label="Phase difference"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Amplitude A</span>
                <span className="text-deepteal font-bold">{(amplitude * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.04}
                step={0.005}
                value={amplitude}
                onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Amplitude"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                <span className="text-deepteal-soft">Wavelength λ</span>
                <span className="text-deepteal font-bold">{wavelength.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={wavelength}
                onChange={(e) => setWavelength(parseFloat(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Wavelength"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={thirdSource} onChange={(e) => setThirdSource(e.target.checked)} className="accent-gold" />
              3rd source
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={wall} onChange={(e) => setWall(e.target.checked)} className="accent-gold" />
              Wall
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-deepteal-soft cursor-pointer">
              <input type="checkbox" checked={freqMismatch} onChange={(e) => setFreqMismatch(e.target.checked)} className="accent-gold" />
              Δf
            </label>
          </div>

          <dl className="bg-cream border border-sage/60 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-deepteal-soft">Formula: 2A·cos(Δφ/2)</dt>
            <dd className="text-deepteal text-right font-bold">{(analyticAmplitude * 100).toFixed(2)} cm</dd>
            <dt className="text-deepteal-soft">Measured at probe</dt>
            <dd className="text-deepteal text-right font-bold">{(measuredAmplitude * 100).toFixed(2)} cm</dd>
          </dl>

          {isClean ? (
            <p className="bg-sage-light/40 border-l-2 border-sage-dark rounded-r-lg p-3 text-xs text-deepteal-soft font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark shrink-0 mt-0.5" />
              <span>
                Two identical sources, no wall — the measured peak matches the closed form from
                Part 3. Add a third source, a wall, or a frequency mismatch to see where it stops
                applying.
              </span>
            </p>
          ) : (
            <p className="bg-gold-light/60 border-l-2 border-gold rounded-r-lg p-3 text-xs text-deepteal font-sans">
              <span className="font-bold">
                {thirdSource ? 'A third source is in.' : wall ? 'The wall is reflecting.' : 'The frequencies no longer match.'}
              </span>{' '}
              The two-source formula no longer describes this point — the measured value came from
              summing the field directly, not from algebra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
