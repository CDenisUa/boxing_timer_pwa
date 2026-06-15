// Core
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
// Hooks
import { useSessionsStore } from '@/hooks/useSessionsStore';

const draft = {
  name: 'Bag work',
  category: 'boxing' as const,
  rounds: 3,
  workSeconds: 180,
  restSeconds: 60,
  soundId: 'beep' as const,
};

describe('useSessionsStore', () => {
  it('finishes loading with an empty list', async () => {
    const { result } = renderHook(() => useSessionsStore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.sessionsCount).toBe(0);
  });

  it('creates, finds, updates and deletes a session', async () => {
    const { result } = renderHook(() => useSessionsStore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let id = '';
    await act(async () => {
      const created = await result.current.createSession(draft);
      id = created.id;
    });
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.getById(id)?.name).toBe('Bag work');

    await act(async () => {
      await result.current.updateSession(id, { ...draft, name: 'Renamed' });
    });
    expect(result.current.getById(id)?.name).toBe('Renamed');

    await act(async () => {
      await result.current.deleteSession(id);
    });
    expect(result.current.sessions).toHaveLength(0);
  });

  it('updateSession returns null for an unknown id', async () => {
    const { result } = renderHook(() => useSessionsStore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let returned: unknown = 'x';
    await act(async () => {
      returned = await result.current.updateSession('nope', draft);
    });
    expect(returned).toBeNull();
  });

  it('applySoundToAll rewrites every session sound', async () => {
    const { result } = renderHook(() => useSessionsStore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createSession(draft);
    });
    await act(async () => {
      await result.current.createSession({ ...draft, name: 'Second' });
    });
    expect(result.current.sessions).toHaveLength(2);

    await act(async () => {
      await result.current.applySoundToAll('bell');
    });
    expect(result.current.sessions.every((s) => s.soundId === 'bell')).toBe(true);
  });

  it('keeps the most recently updated session first', async () => {
    // Monotonic clock so updatedAt ordering is deterministic.
    let clock = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000));

    const { result } = renderHook(() => useSessionsStore());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let firstId = '';
    await act(async () => {
      const a = await result.current.createSession({ ...draft, name: 'A' });
      firstId = a.id;
    });
    await act(async () => {
      await result.current.createSession({ ...draft, name: 'B' });
    });
    // Touch A so it becomes most-recent.
    await act(async () => {
      await result.current.updateSession(firstId, { ...draft, name: 'A2' });
    });
    expect(result.current.sessions[0].name).toBe('A2');
  });
});
