// Storage
import { localStore } from '@/storage/localStore';

// Types
import { AppSettings, SoundId } from '@/types/models';

const SETTINGS_KEY = 'box_timer_settings_v1';
const SOUND_IDS: SoundId[] = ['boxing-gong', 'classic-gong', 'gong', 'beep', 'bell', 'tick', 'chime'];

export const defaultSettings: AppSettings = {
  themeMode: 'system',
  defaultSoundId: 'boxing-gong',
  keepScreenAwake: true,
  prepSeconds: 10,
};

const parseSettings = (raw: string | null): AppSettings => {
  if (!raw) {
    return defaultSettings;
  }

  try {
    const value = JSON.parse(raw) as Partial<AppSettings>;
    const safeSound = SOUND_IDS.includes(value.defaultSoundId as SoundId)
      ? (value.defaultSoundId as SoundId)
      : defaultSettings.defaultSoundId;
    return {
      ...defaultSettings,
      ...value,
      defaultSoundId: safeSound,
    };
  } catch {
    return defaultSettings;
  }
};

export const settingsStorage = {
  async get(): Promise<AppSettings> {
    const raw = await localStore.getItem(SETTINGS_KEY);
    return parseSettings(raw);
  },

  async save(next: AppSettings): Promise<void> {
    await localStore.setItem(SETTINGS_KEY, JSON.stringify(next));
  },
};
