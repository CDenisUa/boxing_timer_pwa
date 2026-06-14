// Storage
import { localStore } from '@/storage/localStore';

// Types
import { Session, SoundId } from '@/types/models';

const SESSIONS_KEY = 'box_timer_sessions_v1';
const SOUND_IDS: SoundId[] = ['boxing-gong', 'classic-gong', 'gong', 'beep', 'bell', 'tick', 'chime'];

const parseSessions = (raw: string | null): Session[] => {
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }

    return (value as Session[]).map((session) => ({
      ...session,
      soundId: SOUND_IDS.includes(session.soundId as SoundId)
        ? (session.soundId as SoundId)
        : 'boxing-gong',
    }));
  } catch {
    return [];
  }
};

export const sessionsStorage = {
  async getAll(): Promise<Session[]> {
    const raw = await localStore.getItem(SESSIONS_KEY);
    return parseSessions(raw);
  },

  async saveAll(sessions: Session[]): Promise<void> {
    await localStore.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },
};
