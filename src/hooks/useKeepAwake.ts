// Core
import { useEffect } from 'react';

type WakeLockSentinelLike = {
  addEventListener?: (type: 'release', listener: () => void) => void;
  removeEventListener?: (type: 'release', listener: () => void) => void;
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
    let requesting = false;

    const handleRelease = () => {
      sentinel = null;
    };

    const release = () => {
      if (!sentinel) {
        return;
      }

      const lock = sentinel;
      sentinel = null;
      lock.removeEventListener?.('release', handleRelease);
      if (!lock.released) {
        void lock.release();
      }
    };

    const request = async () => {
      if (document.visibilityState !== 'visible' || requesting) {
        return;
      }
      if (sentinel && !sentinel.released) {
        return;
      }

      sentinel = null;
      requesting = true;
      try {
        const lock = await nav.wakeLock!.request('screen');
        if (cancelled || document.visibilityState !== 'visible') {
          await lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener?.('release', handleRelease);
      } catch {
        // Permission denied or not allowed in current state — ignore.
      } finally {
        requesting = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void request();
      } else {
        release();
      }
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      release();
    };
  }, [enabled]);
};
