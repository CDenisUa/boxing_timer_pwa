// A tiny async wrapper over localStorage so the rest of the app can keep the
// same Promise-based storage API the native build used (AsyncStorage).

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const localStore = {
  async getItem(key: string): Promise<string | null> {
    if (!isBrowser) {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isBrowser) {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota / privacy-mode errors — the app still works in-memory.
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isBrowser) {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  },
};
