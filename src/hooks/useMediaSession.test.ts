// Core
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Hooks
import { useMediaSession } from '@/hooks/useMediaSession';

type Handlers = Record<string, (() => void) | null>;

const baseOptions = {
  enabled: true,
  title: 'Heavy Bag',
  phase: 'work' as const,
  status: 'running' as const,
  currentRound: 2,
  totalRounds: 5,
  remainingSeconds: 30,
  phaseDurationSeconds: 180,
  canSkip: true,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onSkip: vi.fn(),
};

let handlers: Handlers;
let session: {
  metadata: unknown;
  playbackState: string;
  setActionHandler: (a: string, cb: (() => void) | null) => void;
  setPositionState: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  handlers = {};
  session = {
    metadata: undefined,
    playbackState: 'none',
    setActionHandler: (action: string, cb: (() => void) | null) => {
      handlers[action] = cb;
    },
    setPositionState: vi.fn(),
  };
  Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: session });
  // Minimal MediaMetadata stand-in.
  (globalThis as Record<string, unknown>).MediaMetadata = class {
    constructor(init: unknown) {
      Object.assign(this, init);
    }
  };
});

afterEach(() => {
  // @ts-expect-error remove injected globals
  delete navigator.mediaSession;
  delete (globalThis as Record<string, unknown>).MediaMetadata;
});

describe('useMediaSession', () => {
  it('wires play/pause/stop action handlers to the callbacks', () => {
    const options = { ...baseOptions, onPlay: vi.fn(), onPause: vi.fn(), onStop: vi.fn() };
    renderHook(() => useMediaSession(options));

    handlers.play?.();
    handlers.pause?.();
    handlers.stop?.();
    expect(options.onPlay).toHaveBeenCalled();
    expect(options.onPause).toHaveBeenCalled();
    expect(options.onStop).toHaveBeenCalled();
  });

  it('publishes metadata and a playing state for an active session', () => {
    renderHook(() => useMediaSession(baseOptions));
    // Title carries the live remaining time; artist the round progress.
    expect(session.metadata).toMatchObject({
      title: '00:30 - Work',
      artist: 'Round 2 / 5',
      album: 'Heavy Bag',
    });
    expect(session.playbackState).toBe('playing');
    expect(session.setPositionState).toHaveBeenCalledWith({
      duration: 180,
      position: 30,
      playbackRate: -1,
    });
  });

  it('enables the skip (nexttrack) handler only when canSkip is true', () => {
    const options = { ...baseOptions, onSkip: vi.fn() };
    const { rerender } = renderHook((props) => useMediaSession(props), { initialProps: options });
    expect(handlers.nexttrack).toBeTypeOf('function');
    handlers.nexttrack?.();
    expect(options.onSkip).toHaveBeenCalled();

    rerender({ ...options, canSkip: false });
    expect(handlers.nexttrack).toBeNull();
  });

  it('clears metadata when disabled or idle', () => {
    renderHook(() => useMediaSession({ ...baseOptions, status: 'idle' }));
    expect(session.metadata).toBeNull();
    expect(session.playbackState).toBe('none');
  });
});
