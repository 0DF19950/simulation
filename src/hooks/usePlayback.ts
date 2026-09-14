import { useEffect, useRef, useState } from 'react';

/**
 * A playback clock, in seconds of real time, that runs up to `duration` and
 * stops. It starts again from zero whenever `restartKey` changes — pass the
 * run being shown, so a fresh run always plays from its beginning.
 */
export function usePlayback(duration: number, restartKey: unknown, autoplay = true) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    setT(0);
    setPlaying(autoplay);
  }, [restartKey, autoplay]);

  useEffect(() => {
    if (!playing) {
      lastRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const step = (now - lastRef.current) / 1000;
        setT((prev) => {
          if (prev + step >= duration) {
            setPlaying(false);
            return duration;
          }
          return prev + step;
        });
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  const time = Math.min(t, duration);
  return {
    t: time,
    playing,
    finished: time >= duration,
    toggle: () => {
      if (time >= duration) {
        setT(0);
        setPlaying(true);
      } else {
        setPlaying((p) => !p);
      }
    },
    start: () => {
      if (time >= duration) setT(0);
      setPlaying(true);
    },
    reset: () => {
      setPlaying(false);
      setT(0);
    },
    seek: (next: number) => {
      setPlaying(false);
      setT(Math.max(0, Math.min(duration, next)));
    },
  };
}
