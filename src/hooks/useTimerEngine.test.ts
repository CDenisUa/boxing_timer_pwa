// Core
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Hooks
import { useTimerEngine } from '@/hooks/useTimerEngine';
// Engine
import { TimerConfig, TimerSnapshot } from '@/engine/timerEngine';

const config: TimerConfig = {
  rounds: [
    { workSeconds: 3, restSeconds: 2 },
    { workSeconds: 3, restSeconds: 0 },
  ],
  prepSeconds: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimerEngine', () => {
  it('starts running and bumps the run epoch', () => {
    const { result } = renderHook(() => useTimerEngine({ config }));
    expect(result.current.status).toBe('idle');
    expect(result.current.runEpoch).toBe(0);

    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    expect(result.current.runEpoch).toBe(1);
  });

  it('emits phase events and advances through phases as time passes', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useTimerEngine({ config, onEvent }));

    act(() => result.current.start());
    expect(onEvent).toHaveBeenCalledWith({ type: 'phase_started', phase: 'work' });

    act(() => vi.advanceTimersByTime(3100));
    expect(result.current.phase).toBe('rest');
    expect(onEvent).toHaveBeenCalledWith({ type: 'phase_started', phase: 'rest' });

    act(() => vi.advanceTimersByTime(2100));
    expect(result.current.phase).toBe('work');
    expect(result.current.currentRound).toBe(2);
  });

  it('pauses and resumes, preserving elapsed time', () => {
    const { result } = renderHook(() => useTimerEngine({ config }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');

    const remainingWhenPaused = result.current.remainingSeconds;
    act(() => vi.advanceTimersByTime(5000)); // wall time passes while paused
    expect(result.current.remainingSeconds).toBe(remainingWhenPaused);

    act(() => result.current.resume());
    expect(result.current.status).toBe('running');
    expect(result.current.runEpoch).toBeGreaterThanOrEqual(2);
  });

  it('does not tick while ticking is disabled', () => {
    const { result, rerender } = renderHook((props: { ticking: boolean }) =>
      useTimerEngine({ config, ticking: props.ticking }),
    { initialProps: { ticking: false } });

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.phase).toBe('work');
    expect(result.current.remainingSeconds).toBe(3); // frozen, never ticked

    rerender({ ticking: true });
    act(() => vi.advanceTimersByTime(100)); // total 1.1s elapsed since start
    expect(result.current.remainingSeconds).toBe(2); // ticking resumed
  });

  it('seeds from an initial snapshot without resetting it on mount', () => {
    const seeded: TimerSnapshot = {
      status: 'running',
      phase: 'work',
      prepTargetPhase: 'work',
      currentRound: 2,
      remainingSeconds: 3,
      phaseStartedAt: 0,
      phaseDurationSeconds: 3,
      elapsedBeforePauseSeconds: 0,
    };
    const { result } = renderHook(() => useTimerEngine({ config, initialSnapshot: seeded }));
    expect(result.current.status).toBe('running');
    expect(result.current.currentRound).toBe(2);
  });

  it('reset returns to idle; skip jumps the current phase', () => {
    const { result } = renderHook(() => useTimerEngine({ config }));
    act(() => result.current.start());
    // The hook applies a 3s prep before the skipped-to phase.
    act(() => result.current.skipRound());
    expect(result.current.phase).toBe('prep');
    expect(result.current.prepTargetPhase).toBe('rest');

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.currentRound).toBe(1);
  });

  it('goToRound jumps to the chosen round (via prep) and bumps the epoch', () => {
    const { result } = renderHook(() => useTimerEngine({ config }));
    act(() => result.current.start());
    const epochBefore = result.current.runEpoch;

    act(() => result.current.goToRound(2));
    expect(result.current.currentRound).toBe(2);
    expect(result.current.phase).toBe('prep'); // hook applies a 3s prep
    expect(result.current.runEpoch).toBeGreaterThan(epochBefore);
  });

  it('repeat restarts a finished session', () => {
    const { result } = renderHook(() => useTimerEngine({ config }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.status).toBe('finished');

    act(() => result.current.repeat());
    expect(result.current.status).toBe('running');
    expect(result.current.currentRound).toBe(1);
  });

  it('does not wipe a running timer when the config object changes', () => {
    const { result, rerender } = renderHook((props: { config: TimerConfig }) =>
      useTimerEngine({ config: props.config }),
    { initialProps: { config } });

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    // New config object (e.g. async settings load) while running.
    rerender({ config: { ...config, prepSeconds: 5 } });
    expect(result.current.status).toBe('running');
  });

  it('does reset an idle timer when the config changes', () => {
    const { result, rerender } = renderHook((props: { config: TimerConfig }) =>
      useTimerEngine({ config: props.config }),
    { initialProps: { config } });

    rerender({ config: { rounds: [{ workSeconds: 9, restSeconds: 0 }], prepSeconds: 0 } });
    expect(result.current.remainingSeconds).toBe(9);
  });
});
