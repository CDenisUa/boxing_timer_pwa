// Core
import { useEffect, useMemo, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimerDisplay } from '@/components/TimerDisplay';

// Hooks
import { useKeepAwake } from '@/hooks/useKeepAwake';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useSound } from '@/hooks/useSound';
import { useTimerEngine } from '@/hooks/useTimerEngine';

// Navigation
import { ScreenProps, useIsFocused } from '@/navigation/RootNavigator';

// Storage
import { defaultSettings, settingsStorage } from '@/storage/settingsStorage';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Utils
import { formatSecondsToClock } from '@/utils/timeFormat';

const toGradient = (colors: readonly string[]): string =>
  `linear-gradient(135deg, ${colors.join(', ')})`;

export const SessionRunScreen = ({ route, navigation }: ScreenProps<'SessionRun'>) => {
  const { theme } = useTheme();
  const { getById } = useSessions();
  const { play } = useSound();
  const isFocused = useIsFocused('SessionRun');

  const session = getById(route.params.sessionId);

  const [prepSeconds, setPrepSeconds] = useState(defaultSettings.prepSeconds);
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(defaultSettings.keepScreenAwake);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const settings = await settingsStorage.get();
      if (!mounted) {
        return;
      }
      setPrepSeconds(settings.prepSeconds);
      setKeepAwakeEnabled(settings.keepScreenAwake);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const config = useMemo(
    () => ({
      rounds: session?.rounds ?? 1,
      workSeconds: session?.workSeconds ?? 1,
      restSeconds: session?.rounds === 1 ? 0 : session?.restSeconds ?? 1,
      prepSeconds,
    }),
    [prepSeconds, session?.restSeconds, session?.rounds, session?.workSeconds],
  );

  const engine = useTimerEngine({
    config,
    onEvent: (event) => {
      if (!session) {
        return;
      }
      if (event.type === 'phase_started') {
        void play(session.soundId);
      }
    },
  });

  useKeepAwake(isFocused && keepAwakeEnabled);

  useMediaSession({
    enabled: isFocused && !!session,
    title: session?.name ?? 'Box Timer',
    phase: engine.phase,
    status: engine.status,
    currentRound: engine.currentRound,
    totalRounds: session?.rounds ?? 1,
    remainingSeconds: engine.remainingSeconds,
    phaseDurationSeconds: engine.phaseDurationSeconds,
    canSkip:
      (engine.status === 'running' || engine.status === 'paused') &&
      (engine.phase === 'work' || engine.phase === 'rest'),
    onPlay: () => {
      if (engine.status === 'paused') {
        engine.resume();
      } else if (engine.status === 'finished') {
        engine.repeat();
      } else if (engine.status === 'idle') {
        engine.start();
      }
    },
    onPause: engine.pause,
    onStop: engine.reset,
    onSkip: () => {
      if (engine.phase === 'work') {
        engine.skipRound();
      } else if (engine.phase === 'rest') {
        engine.skipRest();
      }
    },
  });

  const isCriticalCountdown =
    engine.status === 'running' &&
    (engine.phase === 'work' || engine.phase === 'rest') &&
    engine.remainingSeconds <= 10 &&
    engine.remainingSeconds > 0;
  const isRestPhase = engine.phase === 'rest';
  const isRestCritical = isRestPhase && isCriticalCountdown;
  const isWorkCritical = engine.phase === 'work' && isCriticalCountdown;

  const phaseProgress = useMemo(() => {
    if (engine.phaseDurationSeconds <= 0) {
      return 0;
    }
    const elapsed = engine.phaseDurationSeconds - engine.remainingSeconds;
    const raw = elapsed / engine.phaseDurationSeconds;
    if (raw < 0) {
      return 0;
    }
    if (raw > 1) {
      return 1;
    }
    return raw;
  }, [engine.phaseDurationSeconds, engine.remainingSeconds]);

  const nextPhaseText = useMemo(() => {
    if (!session || engine.status === 'idle' || engine.status === 'finished') return null;
    if (engine.phase === 'prep') return null;
    if (engine.phase === 'work') {
      const isLastRound = engine.currentRound >= session.rounds;
      if (isLastRound || config.restSeconds <= 0) return 'UP NEXT: Finish';
      return `UP NEXT: Rest (${formatSecondsToClock(session.restSeconds)})`;
    }
    if (engine.phase === 'rest') {
      return `UP NEXT: Round ${engine.currentRound + 1} - Work (${formatSecondsToClock(session.workSeconds)})`;
    }
    return null;
  }, [config.restSeconds, engine.currentRound, engine.phase, engine.status, session]);

  useEffect(() => {
    if (
      engine.status !== 'running' ||
      (engine.phase !== 'work' && engine.phase !== 'rest') ||
      engine.phaseStartedAt === null
    ) {
      return;
    }

    const phaseStartedAt = engine.phaseStartedAt;
    const duration = engine.phaseDurationSeconds;
    const timeouts: number[] = [];

    // Schedule one tick at each whole-second boundary of the final 10s, anchored
    // to phaseStartedAt — the same clock the display uses. This keeps the beat
    // exactly 1000 ms apart instead of drifting with a polling interval.
    for (let mark = Math.min(10, Math.floor(duration)); mark >= 1; mark -= 1) {
      // The display flips to `mark` once elapsed reaches duration - mark.
      const fireAt = phaseStartedAt + (duration - mark) * 1000;
      const delay = fireAt - Date.now();

      // Skip boundaries already well past (e.g. after resuming mid-countdown)
      // so we don't replay a burst of stale ticks at once.
      if (delay < -250) {
        continue;
      }

      const id = window.setTimeout(() => {
        void play('tick', { vibrate: false });
      }, Math.max(0, delay));
      timeouts.push(id);
    }

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [engine.phase, engine.phaseDurationSeconds, engine.phaseStartedAt, engine.status, play]);

  if (!session) {
    return (
      <div
        className="app-shell"
        style={{
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 16,
          flex: 1,
        }}
      >
        <p style={{ color: theme.colors.text, fontWeight: 800 }}>Session not found</p>
        <PrimaryButton label="Back" onPress={() => navigation.goBack()} />
      </div>
    );
  }

  const showStart = engine.status === 'idle';
  const showPause = engine.status === 'running';
  const showResume = engine.status === 'paused';
  const showRepeat = engine.status === 'finished';
  const showSkipRound = (engine.status === 'running' || engine.status === 'paused') && engine.phase === 'work';
  const showSkipRest = (engine.status === 'running' || engine.status === 'paused') && engine.phase === 'rest';

  const lightModeBase = [theme.colors.background, '#EEF3FA', '#E8EEF7'] as const;
  const lightModeRest = ['#F2FAF6', '#E5F5EE', '#D8EFE6'] as const;
  const lightModeWorkCritical = ['#FFF3F4', '#FFE6EA', '#FFD6DD'] as const;
  const lightModeRestCritical = ['#F0FBF6', '#DFF6EA', '#CFEFDB'] as const;

  const gradientColors = theme.isDark
    ? isRestCritical
      ? ['#0D2D1F', '#114530', '#1B5D43']
      : isWorkCritical
        ? ['#2D1017', '#3A121C', '#591A27']
        : isRestPhase
          ? ['#0C111D', '#10261E', '#17382B']
          : [theme.colors.background, '#111827', '#172033']
    : isRestCritical
      ? [...lightModeRestCritical]
      : isWorkCritical
        ? [...lightModeWorkCritical]
        : isRestPhase
          ? [...lightModeRest]
          : [...lightModeBase];

  const controlBtnStyle = { minHeight: 58 };
  const phaseAccent = isRestPhase ? theme.colors.success : isWorkCritical ? theme.colors.danger : theme.colors.primary;

  return (
    <div
      className="app-shell"
      style={{
        background: toGradient(gradientColors),
        padding: '42px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minHeight: '100%',
      }}
    >
      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: theme.isDark ? 'none' : '0 12px 30px rgba(17, 24, 39, 0.06)',
        }}
      >
        <PrimaryButton label="Back" variant="secondary" size="sm" onPress={() => navigation.goBack()} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              color: phaseAccent,
            }}
          >
            LIVE SESSION
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 20,
              fontWeight: 950,
              color: theme.colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {session.name}
          </div>
        </div>
        <span
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.colors.border,
            borderRadius: 999,
            padding: '7px 10px',
            backgroundColor: theme.colors.surface,
            fontSize: 12,
            fontWeight: 900,
            color: theme.colors.textMuted,
            whiteSpace: 'nowrap',
          }}
        >
          {Math.min(engine.currentRound, session.rounds)} / {session.rounds}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px 0',
        }}
      >
        <TimerDisplay
          phase={engine.phase}
          remainingSeconds={engine.remainingSeconds}
          roundLabel={`Round ${Math.min(engine.currentRound, session.rounds)} / ${session.rounds}`}
          isCritical={isCriticalCountdown}
          phaseProgress={phaseProgress}
          criticalColor={isRestPhase ? '#2FB874' : '#F05454'}
          restColor="#2FB874"
        />
      </div>

      <div
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: theme.isDark ? 'none' : '0 12px 30px rgba(17, 24, 39, 0.08)',
        }}
      >
        {nextPhaseText ? (
          <div
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: theme.colors.border,
              borderRadius: 8,
              backgroundColor: theme.colors.surface,
              padding: '11px 12px',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.6,
              color: theme.colors.textMuted,
            }}
          >
            {nextPhaseText}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
          <PrimaryButton label="Stop" variant="secondary" onPress={engine.reset} style={controlBtnStyle} />
          {showStart ? (
            <PrimaryButton label="Start" onPress={engine.start} size="lg" style={controlBtnStyle} />
          ) : null}
          {showPause ? (
            <PrimaryButton label="Pause" onPress={engine.pause} size="lg" style={controlBtnStyle} />
          ) : null}
          {showResume ? (
            <PrimaryButton label="Resume" onPress={engine.resume} size="lg" style={controlBtnStyle} />
          ) : null}
          {showRepeat ? (
            <PrimaryButton label="Repeat" onPress={engine.repeat} size="lg" style={controlBtnStyle} />
          ) : null}
        </div>

        {showSkipRound ? (
          <PrimaryButton label="Skip round to 3s" variant="secondary" onPress={engine.skipRound} />
        ) : null}
        {showSkipRest ? (
          <PrimaryButton label="Skip rest to 3s" variant="secondary" onPress={engine.skipRest} />
        ) : null}
      </div>
    </div>
  );
};
