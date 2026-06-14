// Types
import { TimerPhase, TimerStatus } from '@/types/models';

export type TimerConfig = {
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  prepSeconds: number;
};

export type TimerSnapshot = {
  status: TimerStatus;
  phase: TimerPhase;
  prepTargetPhase: Extract<TimerPhase, 'work' | 'rest' | 'finished'>;
  currentRound: number;
  remainingSeconds: number;
  phaseStartedAt: number | null;
  phaseDurationSeconds: number;
  elapsedBeforePauseSeconds: number;
};

export type TimerEvent = {
  type: 'phase_started';
  phase: Extract<TimerPhase, 'work' | 'rest'>;
};

export const createInitialSnapshot = (config: TimerConfig): TimerSnapshot => ({
  status: 'idle',
  phase: config.prepSeconds > 0 ? 'prep' : 'work',
  prepTargetPhase: 'work',
  currentRound: 1,
  remainingSeconds: config.prepSeconds > 0 ? config.prepSeconds : config.workSeconds,
  phaseStartedAt: null,
  phaseDurationSeconds: config.prepSeconds > 0 ? config.prepSeconds : config.workSeconds,
  elapsedBeforePauseSeconds: 0,
});

const toRemaining = (duration: number, elapsedSec: number): number => {
  const value = Math.ceil(duration - elapsedSec);
  return value > 0 ? value : 0;
};

const beginPhase = (
  snapshot: TimerSnapshot,
  phase: TimerPhase,
  now: number,
  durationSeconds: number,
  nextRound?: number,
): TimerSnapshot => ({
  ...snapshot,
  phase,
  prepTargetPhase: phase === 'prep' ? snapshot.prepTargetPhase : 'work',
  status: phase === 'finished' ? 'finished' : snapshot.status,
  currentRound: nextRound ?? snapshot.currentRound,
  phaseStartedAt: phase === 'finished' ? null : now,
  phaseDurationSeconds: durationSeconds,
  elapsedBeforePauseSeconds: 0,
  remainingSeconds: phase === 'finished' ? 0 : durationSeconds,
});

const toFinished = (snapshot: TimerSnapshot): TimerSnapshot => ({
  ...snapshot,
  phase: 'finished',
  prepTargetPhase: 'finished',
  status: 'finished',
  remainingSeconds: 0,
  phaseStartedAt: null,
  phaseDurationSeconds: 0,
  elapsedBeforePauseSeconds: 0,
});

const startTargetFromPrep = (
  snapshot: TimerSnapshot,
  config: TimerConfig,
  now: number,
): { snapshot: TimerSnapshot; event?: TimerEvent } => {
  if (snapshot.prepTargetPhase === 'finished') {
    return { snapshot: toFinished(snapshot) };
  }

  if (snapshot.prepTargetPhase === 'rest') {
    const next = beginPhase(snapshot, 'rest', now, config.restSeconds);
    return { snapshot: next, event: { type: 'phase_started', phase: 'rest' } };
  }

  const next = beginPhase(snapshot, 'work', now, config.workSeconds);
  return { snapshot: next, event: { type: 'phase_started', phase: 'work' } };
};

const advancePhase = (
  snapshot: TimerSnapshot,
  config: TimerConfig,
  now: number,
): { snapshot: TimerSnapshot; event?: TimerEvent } => {
  if (snapshot.phase === 'prep') {
    return startTargetFromPrep(snapshot, config, now);
  }

  if (snapshot.phase === 'work') {
    if (snapshot.currentRound >= config.rounds) {
      return { snapshot: toFinished(snapshot) };
    }

    if (config.restSeconds <= 0) {
      const next = beginPhase(snapshot, 'work', now, config.workSeconds, snapshot.currentRound + 1);
      return { snapshot: next, event: { type: 'phase_started', phase: 'work' } };
    }

    const next = beginPhase(snapshot, 'rest', now, config.restSeconds);
    return { snapshot: next, event: { type: 'phase_started', phase: 'rest' } };
  }

  if (snapshot.phase === 'rest') {
    const next = beginPhase(snapshot, 'work', now, config.workSeconds, snapshot.currentRound + 1);
    return { snapshot: next, event: { type: 'phase_started', phase: 'work' } };
  }

  return { snapshot };
};

export const startTimer = (
  prev: TimerSnapshot,
  config: TimerConfig,
  now: number,
): { snapshot: TimerSnapshot; events: TimerEvent[] } => {
  if (prev.status === 'running') {
    return { snapshot: prev, events: [] };
  }

  const base = createInitialSnapshot(config);

  if (config.prepSeconds <= 0) {
    return {
      snapshot: {
        ...base,
        status: 'running',
        phase: 'work',
        phaseStartedAt: now,
        phaseDurationSeconds: config.workSeconds,
        remainingSeconds: config.workSeconds,
      },
      events: [{ type: 'phase_started', phase: 'work' }],
    };
  }

  return {
    snapshot: {
      ...base,
      status: 'running',
      phaseStartedAt: now,
      remainingSeconds: config.prepSeconds,
    },
    events: [],
  };
};

export const pauseTimer = (prev: TimerSnapshot, now: number): TimerSnapshot => {
  if (prev.status !== 'running' || prev.phaseStartedAt === null) {
    return prev;
  }

  const elapsed = (now - prev.phaseStartedAt) / 1000;
  return {
    ...prev,
    status: 'paused',
    elapsedBeforePauseSeconds: elapsed,
    remainingSeconds: toRemaining(prev.phaseDurationSeconds, elapsed),
    phaseStartedAt: null,
  };
};

export const resumeTimer = (prev: TimerSnapshot, now: number): TimerSnapshot => {
  if (prev.status !== 'paused') {
    return prev;
  }

  return {
    ...prev,
    status: 'running',
    phaseStartedAt: now - prev.elapsedBeforePauseSeconds * 1000,
  };
};

export const resetTimer = (config: TimerConfig): TimerSnapshot => createInitialSnapshot(config);

export const skipWorkPhase = (
  prev: TimerSnapshot,
  config: TimerConfig,
  now: number,
  prepSeconds: number,
): TimerSnapshot => {
  if (prev.phase !== 'work' || prev.status === 'finished') {
    return prev;
  }

  const target: Extract<TimerPhase, 'rest' | 'finished'> =
    prev.currentRound >= config.rounds ? 'finished' : 'rest';

  if (prepSeconds <= 0) {
    if (target === 'finished') {
      return toFinished(prev);
    }

    return {
      ...prev,
      phase: 'rest',
      prepTargetPhase: 'work',
      status: 'running',
      phaseStartedAt: now,
      phaseDurationSeconds: config.restSeconds,
      elapsedBeforePauseSeconds: 0,
      remainingSeconds: config.restSeconds,
    };
  }

  return {
    ...prev,
    status: 'running',
    phase: 'prep',
    prepTargetPhase: target,
    phaseStartedAt: now,
    phaseDurationSeconds: prepSeconds,
    elapsedBeforePauseSeconds: 0,
    remainingSeconds: prepSeconds,
  };
};

export const skipRestPhase = (
  prev: TimerSnapshot,
  config: TimerConfig,
  now: number,
  prepSeconds: number,
): TimerSnapshot => {
  if (prev.phase !== 'rest' || prev.status === 'finished') {
    return prev;
  }

  const target: Extract<TimerPhase, 'work' | 'finished'> =
    prev.currentRound >= config.rounds ? 'finished' : 'work';

  if (prepSeconds <= 0) {
    if (target === 'finished') {
      return toFinished(prev);
    }

    return {
      ...prev,
      phase: 'work',
      prepTargetPhase: 'work',
      status: 'running',
      phaseStartedAt: now,
      phaseDurationSeconds: config.workSeconds,
      elapsedBeforePauseSeconds: 0,
      remainingSeconds: config.workSeconds,
      currentRound: prev.currentRound + 1,
    };
  }

  return {
    ...prev,
    status: 'running',
    phase: 'prep',
    prepTargetPhase: target,
    phaseStartedAt: now,
    phaseDurationSeconds: prepSeconds,
    elapsedBeforePauseSeconds: 0,
    remainingSeconds: prepSeconds,
    currentRound: prev.currentRound + 1,
  };
};

export const tickTimer = (
  prev: TimerSnapshot,
  config: TimerConfig,
  now: number,
): { snapshot: TimerSnapshot; events: TimerEvent[] } => {
  if (prev.status !== 'running' || prev.phaseStartedAt === null) {
    return { snapshot: prev, events: [] };
  }

  let snapshot = prev;
  let startedAt = prev.phaseStartedAt;
  const events: TimerEvent[] = [];

  while (snapshot.status === 'running') {
    const elapsed = (now - startedAt) / 1000;
    if (elapsed < snapshot.phaseDurationSeconds) {
      snapshot = {
        ...snapshot,
        remainingSeconds: toRemaining(snapshot.phaseDurationSeconds, elapsed),
      };
      return { snapshot, events };
    }

    const phaseEnd = startedAt + snapshot.phaseDurationSeconds * 1000;
    const result = advancePhase(snapshot, config, phaseEnd);
    snapshot = result.snapshot;

    if (result.event) {
      events.push(result.event);
    }

    if (snapshot.status !== 'running' || snapshot.phaseStartedAt === null) {
      return { snapshot, events };
    }

    startedAt = snapshot.phaseStartedAt;
  }

  return { snapshot, events };
};
