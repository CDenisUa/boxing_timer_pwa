// Storage
import { localStore } from '@/storage/localStore';

// Types
import { RoundConfig, Session, SoundId } from '@/types/models';

const SESSIONS_KEY = 'box_timer_sessions_v1';
const SOUND_IDS: SoundId[] = ['boxing-gong', 'classic-gong', 'gong', 'beep', 'bell', 'tick', 'chime'];

const parseRoundsConfig = (value: unknown): RoundConfig[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const cleaned = value
    .filter(
      (round): round is { workSeconds: number; restSeconds?: number } =>
        !!round && typeof (round as RoundConfig).workSeconds === 'number',
    )
    .map((round) => ({
      workSeconds: Math.max(1, Math.floor(round.workSeconds)),
      restSeconds: Math.max(0, Math.floor(round.restSeconds ?? 0)),
    }));

  return cleaned.length > 0 ? cleaned : undefined;
};

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
      roundsConfig: parseRoundsConfig((session as Session).roundsConfig),
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
