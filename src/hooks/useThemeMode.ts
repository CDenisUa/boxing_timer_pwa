// Core
import { useCallback, useEffect, useMemo, useState } from 'react';

// Storage
import { defaultSettings, settingsStorage } from '@/storage/settingsStorage';

// Types
import { ThemeMode } from '@/types/models';

const getSystemScheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeMode = () => {
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(getSystemScheme);
  const [mode, setModeState] = useState<ThemeMode>(defaultSettings.themeMode);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setSystemScheme(event.matches ? 'dark' : 'light');
    };

    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const settings = await settingsStorage.get();
      if (!mounted) {
        return;
      }
      setModeState(settings.themeMode);
      setIsLoaded(true);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    const prev = await settingsStorage.get();
    await settingsStorage.save({
      ...prev,
      themeMode: next,
    });
  }, []);

  const resolvedMode = useMemo<'light' | 'dark'>(() => {
    if (mode === 'light') {
      return 'light';
    }
    if (mode === 'dark') {
      return 'dark';
    }
    return systemScheme;
  }, [mode, systemScheme]);

  return {
    mode,
    setMode,
    resolvedMode,
    isLoaded,
  };
};
