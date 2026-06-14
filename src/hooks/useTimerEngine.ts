// Core
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Engine
import {
  TimerConfig,
  TimerEvent,
  TimerSnapshot,
  createInitialSnapshot,
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
};

export const useTimerEngine = ({ config, onEvent }: Options) => {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(() => createInitialSnapshot(config));
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
    setSnapshot(resetTimer(config));
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
    if (snapshot.status !== 'running') {
      return;
    }

    const id = setInterval(() => {
      const now = Date.now();
      setSnapshot((prev) => {
        const result = tickTimer(prev, configRef.current, now);
        dispatchEvents(result.events);
        return result.snapshot;
      });
    }, 250);

    return () => clearInterval(id);
  }, [dispatchEvents, snapshot.status]);

  const start = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => {
      const result = startTimer(prev, configRef.current, now);
      dispatchEvents(result.events);
      return result.snapshot;
    });
  }, [dispatchEvents]);

  const pause = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => pauseTimer(prev, now));
  }, []);

  const resume = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => resumeTimer(prev, now));
  }, []);

  const reset = useCallback(() => {
    setSnapshot(resetTimer(configRef.current));
  }, []);

  const repeat = useCallback(() => {
    const now = Date.now();
    setSnapshot(() => {
      const base = resetTimer(configRef.current);
      const result = startTimer(base, configRef.current, now);
      dispatchEvents(result.events);
      return result.snapshot;
    });
  }, [dispatchEvents]);

  const skipRound = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => skipWorkPhase(prev, configRef.current, now, 3));
  }, []);

  const skipRest = useCallback(() => {
    const now = Date.now();
    setSnapshot((prev) => skipRestPhase(prev, configRef.current, now, 3));
  }, []);

  return useMemo(
    () => ({
      ...snapshot,
      start,
      pause,
      resume,
      reset,
      repeat,
      skipRound,
      skipRest,
    }),
    [pause, repeat, reset, resume, skipRest, skipRound, snapshot, start],
  );
};
