export type SessionCategory = 'boxing' | 'running' | 'custom';

export type SoundId =
  | 'boxing-gong'
  | 'classic-gong'
  | 'gong'
  | 'beep'
  | 'bell'
  | 'tick'
  | 'chime';

export type Session = {
  id: string;
  name: string;
  category: SessionCategory;
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  soundId: SoundId;
  createdAt: number;
  updatedAt: number;
};

export type TimerPhase = 'prep' | 'work' | 'rest' | 'finished';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppSettings = {
  themeMode: ThemeMode;
  defaultSoundId: SoundId;
  keepScreenAwake: boolean;
  prepSeconds: number;
};
