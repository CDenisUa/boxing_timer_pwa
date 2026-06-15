// Core
import { ReactElement } from 'react';
import { render } from '@testing-library/react';
// App
import { SessionsProvider } from '@/app/SessionsProvider';
// Theme
import { ThemeProvider } from '@/theme/ThemeProvider';
// Types
import { Session } from '@/types/models';

/** Renders a node inside the ThemeProvider (most components need useTheme). */
export const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

/** Renders inside Theme + Sessions providers, for screen-level tests. */
export const renderWithProviders = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <SessionsProvider>{ui}</SessionsProvider>
    </ThemeProvider>,
  );

export const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  name: 'Heavy Bag',
  category: 'boxing',
  rounds: 3,
  workSeconds: 180,
  restSeconds: 60,
  soundId: 'boxing-gong',
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});
