// Core
import { useEffect, useRef, useState } from 'react';

// Types
import { TimerPhase, TimerStatus } from '@/types/models';

const base = import.meta.env.BASE_URL;

type Options = {
  /** Run screen is active. */
  enabled: boolean;
  phase: TimerPhase;
  status: TimerStatus;
  phaseStartedAt: number | null;
  phaseDurationSeconds: number;
  /** How many trailing seconds get a tick (default 10). */
  lastSeconds?: number;
};

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Plays a tick on each of the final whole seconds of a work/rest phase.
 *
 * Timing is driven by the Web Audio clock, not HTMLAudioElement playback or
 * setTimeout — both of which have variable, audible start latency that makes a
 * once-per-second beat sound uneven. Each tick is scheduled ahead of time at a
 * precise AudioContext time, so the cadence stays sample-accurate.
 */
export const useCountdownTicker = ({
  enabled,
  phase,
  status,
  phaseStartedAt,
  phaseDurationSeconds,
  lastSeconds = 10,
}: Options) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const [ready, setReady] = useState(false);

  // Create the AudioContext and decode the tick sample once.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioCtx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`${base}sounds/tick.wav`);
        const encoded = await response.arrayBuffer();
        const decoded = await ctx.decodeAudioData(encoded);
        if (!cancelled) {
          bufferRef.current = decoded;
          setReady(true);
        }
      } catch {
        // Decode/fetch failure — countdown ticks are best-effort.
      }
    })();

    // Unlock the context on the first user gesture (strict autoplay policies).
    const unlock = () => {
      void ctx.resume().catch(() => undefined);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      void ctx.close().catch(() => undefined);
      ctxRef.current = null;
      bufferRef.current = null;
      setReady(false);
    };
  }, []);

  // Schedule the trailing ticks for the current phase.
  useEffect(() => {
    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (!ready || !ctx || !buffer) {
      return;
    }
    if (!enabled || status !== 'running' || phaseStartedAt === null) {
      return;
    }
    if ((phase !== 'work' && phase !== 'rest') || phaseDurationSeconds <= 0) {
      return;
    }

    // The context starts suspended until a user gesture unlocks audio.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }

    const sources: AudioBufferSourceNode[] = [];
    const now = Date.now();
    const maxMark = Math.min(lastSeconds, Math.floor(phaseDurationSeconds));

    for (let mark = maxMark; mark >= 1; mark -= 1) {
      // The display flips to `mark` once elapsed reaches duration - mark; the
      // tick should land on that same instant.
      const fireAtMs = phaseStartedAt + (phaseDurationSeconds - mark) * 1000;
      const offsetSec = (fireAtMs - now) / 1000;

      // Skip boundaries already (well) past — e.g. resuming mid-countdown.
      if (offsetSec < -0.2) {
        continue;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime + Math.max(0, offsetSec));
      sources.push(source);
    }

    return () => {
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // Already started/stopped — safe to ignore.
        }
        source.disconnect();
      });
    };
  }, [ready, enabled, phase, status, phaseStartedAt, phaseDurationSeconds, lastSeconds]);
};
