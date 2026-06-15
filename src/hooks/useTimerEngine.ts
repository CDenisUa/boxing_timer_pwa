// Core
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Engine
import {
  TimerConfig,
  TimerEvent,
  TimerSnapshot,
  createInitialSnapshot,
  jumpToRound,
  pauseTimer,
  resetTimer,
  resumeTimer,
  skipRestPhase,
  skipWorkPhase,
  startTimer,
  tickTimer,
} from '@/engine/timerEngine';

type Options = {
  config: TimerConfig;
  onEvent?: (event: TimerEvent) => void;
  /** Seed a restored, in-progress session (e.g. after the PWA was reloaded). */
  initialSnapshot?: TimerSnapshot | null;
  /**
   * When false the tick interval is suspended even while running — used to hold
   * a restored session steady until its real config (rounds) has loaded, so the
   * timer can't false-advance against a placeholder config.
   */
  ticking?: boolean;
};

export const useTimerEngine = ({ config, onEvent, initialSnapshot, ticking = true }: Options) => {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(
    () => initialSnapshot ?? createInitialSnapshot(config),
  );
  const [runEpoch, setRunEpoch] = useState(0);
  const configRef = useRef(config);
  const initializedRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
    // Skip the redundant reset on mount (useState already seeded the snapshot),
    // and never wipe an active run when config changes (e.g. async settings load
    // or a restored session whose rounds arrive a moment later).
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    setSnapshot((prev) => (prev.status === 'idle' ? resetTimer(config) : prev));
  }, [config]);

  const dispatchEvents = useCallback(
    (events: TimerEvent[]) => {
      if (!onEvent || events.length === 0) {
        return;
      }

      events.forEach((event) => onEvent(event));
    },
    [onEvent],
  );

  useEffect(() => {
    if (snapshot.status !== 'running' || !ticking) {
      return;
    }

    const id = setInterval(() => {
      const now = Date.now();
      setSnapshot((prev) => {
        const result = tickTimer(prev, configRef.current, now);
        dispatchEvents(result.events);
        return result.snapshot;
      });
    }, 100);

    return () => clearInterval(id);
  }, [dispatchEvents, snapshot.status, ticking]);

  // Bumped whenever the audio timeline must be re-anchored: a (re)start, resume,
  // skip or repeat. The audio scheduler re-reads the timeline on each change.
  const bumpEpoch = useCallback(() => setRunEpoch((value) => value + 1), []);

  const start = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => {
      const result = startTimer(prev, configRef.current, now);
      dispatchEvents(result.events);
      return result.snapshot;
    });
    bumpEpoch();
  }, [bumpEpoch, dispatchEvents]);

  const pause = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => pauseTimer(prev, now));
  }, []);

  const resume = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => resumeTimer(prev, now));
    bumpEpoch();
  }, [bumpEpoch]);

  const reset = useCallback(() => {
    setSnapshot(resetTimer(configRef.current));
    bumpEpoch();
  }, [bumpEpoch]);

  const repeat = useCallback(() => {
    const now = Date.now();
    setSnapshot(() => {
      const base = resetTimer(configRef.current);
      const result = startTimer(base, configRef.current, now);
      dispatchEvents(result.events);
      return result.snapshot;
    });
    bumpEpoch();
  }, [bumpEpoch, dispatchEvents]);

  const skipRound = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => skipWorkPhase(prev, configRef.current, now, 3));
    bumpEpoch();
  }, [bumpEpoch]);

  const skipRest = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => skipRestPhase(prev, configRef.current, now, 3));
    bumpEpoch();
  }, [bumpEpoch]);

  const goToRound = useCallback(
    (round: number) => {
      const now = Date.now();
      setSnapshot((prev) => jumpToRound(prev, configRef.current, now, round, 3));
      bumpEpoch();
    },
    [bumpEpoch],
  );

  return useMemo(
    () => ({
      ...snapshot,
      runEpoch,
      start,
      pause,
      resume,
      reset,
      repeat,
      skipRound,
      skipRest,
      goToRound,
    }),
    [goToRound, pause, repeat, reset, resume, runEpoch, skipRest, skipRound, snapshot, start],
  );
};
