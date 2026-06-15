// Core
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
// Hooks
import { useThemeMode } from '@/hooks/useThemeMode';
// Storage
import { settingsStorage } from '@/storage/settingsStorage';

const mockMatchMedia = (matches: boolean) => {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    emit: (next: boolean) =>
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent)),
  };
};

afterEach(() => vi.restoreAllMocks());

describe('useThemeMode', () => {
  it('defaults to system mode and resolves from the system scheme', async () => {
    mockMatchMedia(true); // system prefers dark
    const { result } = renderHook(() => useThemeMode());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.mode).toBe('system');
    expect(result.current.resolvedMode).toBe('dark');
  });

  it('persists an explicit mode and resolves to it', async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useThemeMode());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.setMode('dark');
    });
    expect(result.current.resolvedMode).toBe('dark');
    expect((await settingsStorage.get()).themeMode).toBe('dark');
  });

  it('reacts to a live system scheme change while in system mode', async () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useThemeMode());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.resolvedMode).toBe('light');

    act(() => media.emit(true));
    expect(result.current.resolvedMode).toBe('dark');
  });
});
