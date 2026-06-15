// Core
import { useEffect, useRef } from 'react';

// Types
import { TimerPhase, TimerStatus } from '@/types/models';

const base = import.meta.env.BASE_URL;

type MediaSessionOptions = {
  /** Whether the run screen is active — controls are torn down when false. */
  enabled: boolean;
  /** Session name, shown as the artwork subtitle. */
  title: string;
  phase: TimerPhase;
  status: TimerStatus;
  currentRound: number;
  totalRounds: number;
  remainingSeconds: number;
  phaseDurationSeconds: number;
  canSkip: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
};

const PHASE_LABEL: Record<TimerPhase, string> = {
  prep: 'Get Ready',
  work: 'Work',
  rest: 'Rest',
  finished: 'Finished',
};

export const useMediaSession = (options: MediaSessionOptions) => {
  const {
    enabled,
    title,
    phase,
    status,
    currentRound,
    totalRounds,
    remainingSeconds,
    phaseDurationSeconds,
    canSkip,
    onPlay,
    onPause,
    onStop,
    onSkip,
  } = options;

  // Keep the latest callbacks without re-registering action handlers each tick.
  const handlersRef = useRef({ onPlay, onPause, onStop, onSkip });
  handlersRef.current = { onPlay, onPause, onStop, onSkip };

  // Register action handlers once the session is available.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => handlersRef.current.onPlay());
    ms.setActionHandler('pause', () => handlersRef.current.onPause());
    ms.setActionHandler('stop', () => handlersRef.current.onStop());

    return () => {
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('stop', null);
      ms.setActionHandler('nexttrack', null);
    };
  }, []);

  // "Next track" maps to skipping the current phase — only when a skip applies.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.setActionHandler(
      'nexttrack',
      canSkip ? () => handlersRef.current.onSkip() : null,
    );
  }, [canSkip]);

  // Reflect timer state in the Media Session metadata / position.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const ms = navigator.mediaSession;

    if (!enabled || status === 'idle') {
      ms.metadata = null;
      ms.playbackState = 'none';
      return;
    }

    const roundText =
      phase === 'finished'
        ? 'Session complete'
        : `Round ${Math.min(currentRound, totalRounds)} / ${totalRounds}`;

    ms.metadata = new MediaMetadata({
      title: PHASE_LABEL[phase],
      artist: roundText,
      album: title,
      artwork: [
        { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      ],
    });

    ms.playbackState = status === 'running' ? 'playing' : 'paused';

    if (typeof ms.setPositionState === 'function') {
      const duration = phaseDurationSeconds;
      if (duration > 0) {
        const position = Math.min(Math.max(duration - remainingSeconds, 0), duration);
        try {
          ms.setPositionState({ duration, position, playbackRate: 1 });
        } catch {
          // Some engines reject odd position/duration combos — non-fatal.
        }
      }
    }
  }, [
    enabled,
    title,
    phase,
    status,
    currentRound,
    totalRounds,
    remainingSeconds,
    phaseDurationSeconds,
  ]);
};
