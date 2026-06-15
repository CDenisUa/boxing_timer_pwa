// Core
import { useCallback, useEffect, useRef } from 'react';

// Types
import { SoundId } from '@/types/models';

const base = import.meta.env.BASE_URL;

export const SOUND_FILES: Record<SoundId, string> = {
  'boxing-gong': `${base}sounds/boxing-gong.mp3`,
  'classic-gong': `${base}sounds/the-sound-of-a-gong.mp3`,
  gong: `${base}sounds/gong.wav`,
  beep: `${base}sounds/beep.wav`,
  bell: `${base}sounds/bell.wav`,
  tick: `${base}sounds/tick.wav`,
  chime: `${base}sounds/chime.wav`,
};

export const soundOptions: { id: SoundId; label: string }[] = [
  { id: 'boxing-gong', label: 'Boxing Gong (Default)' },
  { id: 'classic-gong', label: 'Classic Gong' },
  { id: 'gong', label: 'Gong (Legacy)' },
  { id: 'beep', label: 'Beep' },
  { id: 'bell', label: 'Bell' },
  { id: 'tick', label: 'Tick' },
  { id: 'chime', label: 'Chime' },
];

const vibrate = (durationMs: number) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Vibration unsupported / blocked — ignore.
    }
  }
};

export const useSound = () => {
  const soundsRef = useRef<Partial<Record<SoundId, HTMLAudioElement>>>({});

  useEffect(() => {
    const elements: Partial<Record<SoundId, HTMLAudioElement>> = {};

    (Object.entries(SOUND_FILES) as [SoundId, string][]).forEach(([id, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      // Avoid interfering with background music on some browsers.
      audio.crossOrigin = 'anonymous';
      elements[id] = audio;
    });

    soundsRef.current = elements;

    return () => {
      Object.values(soundsRef.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      soundsRef.current = {};
    };
  }, []);

  const play = useCallback(async (soundId: SoundId, options?: { vibrate?: boolean }) => {
    if (options?.vibrate !== false) {
      vibrate(180);
    }

    const prepared = soundsRef.current[soundId];
    const audio = prepared ?? new Audio(SOUND_FILES[soundId]);

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Autoplay policy may block playback until the first user gesture — ignore.
    }
  }, []);

  return {
    play,
    soundOptions,
  };
};
