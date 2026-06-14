// Core
import React, { createContext, useContext, useEffect, useMemo } from 'react';

// Hooks
import { useThemeMode } from '@/hooks/useThemeMode';

// Theme
import { AppTheme, darkTheme, lightTheme } from '@/theme/theme';

// Types
import { ThemeMode } from '@/types/models';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (next: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: Props) => {
  const { mode, resolvedMode, setMode } = useThemeMode();

  const theme = useMemo<AppTheme>(
    () => (resolvedMode === 'dark' ? darkTheme : lightTheme),
    [resolvedMode],
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = resolvedMode;
    document.documentElement.style.colorScheme = resolvedMode;
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme.colors.background);
    }
  }, [resolvedMode, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, setMode }),
    [theme, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
