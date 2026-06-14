// Core
import { useEffect } from 'react';

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  released: boolean;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

/**
 * Keeps the screen awake while `enabled` is true using the Screen Wake Lock API.
 * Silently does nothing on browsers that don't support it.
 */
export const useKeepAwake = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined') {
      return;
    }

    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) {
      return;
    }

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await nav.wakeLock!.request('screen');
        if (cancelled) {
          await lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        // Permission denied or not allowed in current state — ignore.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) {
        void request();
      }
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinel && !sentinel.released) {
        void sentinel.release();
      }
    };
  }, [enabled]);
};
