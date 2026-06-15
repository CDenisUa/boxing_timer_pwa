// Core
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
// Hooks
import { useKeepAwake } from '@/hooks/useKeepAwake';

type Sentinel = { release: ReturnType<typeof vi.fn>; released: boolean };

const installWakeLock = () => {
  const sentinels: Sentinel[] = [];
  const request = vi.fn(async () => {
    const sentinel: Sentinel = {
      released: false,
      release: vi.fn(async () => {
        sentinel.released = true;
      }),
    };
    sentinels.push(sentinel);
    return sentinel;
  });
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  return { request, sentinels };
};

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
};

afterEach(() => {
  // @ts-expect-error cleanup the injected property
  delete navigator.wakeLock;
});

describe('useKeepAwake', () => {
  it('requests a wake lock when enabled', async () => {
    const { request } = installWakeLock();
    renderHook(() => useKeepAwake(true));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  });

  it('does not request when disabled', () => {
    const { request } = installWakeLock();
    renderHook(() => useKeepAwake(false));
    expect(request).not.toHaveBeenCalled();
  });

  it('releases the lock on unmount', async () => {
    const { sentinels } = installWakeLock();
    const { unmount } = renderHook(() => useKeepAwake(true));
    await waitFor(() => expect(sentinels).toHaveLength(1));
    unmount();
    await waitFor(() => expect(sentinels[0].release).toHaveBeenCalled());
  });

  it('re-acquires the lock when the page becomes visible again', async () => {
    const { request, sentinels } = installWakeLock();
    renderHook(() => useKeepAwake(true));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    // Simulate the lock being dropped (e.g. tab hidden), then returning.
    sentinels[0].released = true;
    setVisibility('visible');
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('is a no-op when the Wake Lock API is unavailable', () => {
    expect(() => renderHook(() => useKeepAwake(true))).not.toThrow();
  });
});
