// Engine
import { TimerSnapshot } from '@/engine/timerEngine';
// Storage
import { localStore } from '@/storage/localStore';

const RUN_KEY = 'box_timer_run_v1';

/** How long a saved run stays restorable. Beyond this it's treated as stale. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export type PersistedRun = {
  sessionId: string;
  snapshot: TimerSnapshot;
  savedAt: number;
};

const isFresh = (run: PersistedRun): boolean =>
  Date.now() - run.savedAt < MAX_AGE_MS &&
  (run.snapshot.status === 'running' || run.snapshot.status === 'paused');

const parse = (raw: string | null): PersistedRun | null => {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as PersistedRun;
    if (!value?.sessionId || !value.snapshot) {
      return null;
    }
    return isFresh(value) ? value : null;
  } catch {
    return null;
  }
};

export const runStateStorage = {
  /** Synchronous read for restoring the initial route without a flash. */
  read(): PersistedRun | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return parse(window.localStorage.getItem(RUN_KEY));
    } catch {
      return null;
    }
  },

  async save(run: PersistedRun): Promise<void> {
    await localStore.setItem(RUN_KEY, JSON.stringify(run));
  },

  async clear(): Promise<void> {
    await localStore.removeItem(RUN_KEY);
  },
};
