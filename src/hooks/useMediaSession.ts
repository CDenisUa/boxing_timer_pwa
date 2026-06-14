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

/**
 * Builds a short looping silent WAV. The OS only surfaces lock-screen / media
 * controls while an audio element is actively playing, so we keep this silent
 * track running for the lifetime of an active timer and reflect the real timer
 * state through the Media Session metadata instead.
 */
const createSilentTrackUrl = (): string => {
  const sampleRate = 8000;
  const seconds = 1;
  const numSamples = sampleRate * seconds;
  const dataSize = numSamples; // 8-bit mono → 1 byte/sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate (sampleRate * blockAlign)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  // 8-bit PCM silence is the mid value 128.
  for (let i = 0; i < numSamples; i += 1) {
    view.setUint8(44 + i, 128);
  }

  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lazily create the silent track once and tear it down on unmount.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const url = createSilentTrackUrl();
    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, []);

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

  // Start / stop the silent track as the timer becomes active or idle.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const shouldHold = enabled && (status === 'running' || status === 'paused');

    if (shouldHold) {
      if (audio.paused) {
        // Autoplay policy may reject this until a user gesture — ignore failures.
        void audio.play().catch(() => undefined);
      }
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [enabled, status]);

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
