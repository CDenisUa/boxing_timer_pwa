// Core
import { useEffect, useMemo, useRef, useState } from 'react';

// App
import { useSessions } from '@/app/SessionsProvider';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimerDisplay } from '@/components/TimerDisplay';

// Hooks
import { useKeepAwake } from '@/hooks/useKeepAwake';
import { useSound } from '@/hooks/useSound';
import { useTimerEngine } from '@/hooks/useTimerEngine';

// Navigation
import { ScreenProps, useIsFocused } from '@/navigation/RootNavigator';

// Storage
import { defaultSettings, settingsStorage } from '@/storage/settingsStorage';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

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
      return `UP NEXT: Rest (${session.restSeconds}s)`;
    }
    if (engine.phase === 'rest') {
      return `UP NEXT: Round ${engine.currentRound + 1} — Work (${session.workSeconds}s)`;
    }
    return null;
  }, [config.restSeconds, engine.currentRound, engine.phase, engine.status, session]);

  const lastTickSecondRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      engine.status !== 'running' ||
      (engine.phase !== 'work' && engine.phase !== 'rest') ||
      engine.phaseStartedAt === null
    ) {
      lastTickSecondRef.current = null;
      return;
    }

    const phaseStartedAt = engine.phaseStartedAt;
    const intervalId = window.setInterval(() => {
      const elapsed = (Date.now() - phaseStartedAt) / 1000;
      const exactRemaining = engine.phaseDurationSeconds - elapsed;
      const secondMark = Math.ceil(exactRemaining);

      if (secondMark > 10 || secondMark <= 0) {
        return;
      }
      if (lastTickSecondRef.current === secondMark) {
        return;
      }

      lastTickSecondRef.current = secondMark;
      void play('tick', { vibrate: false });
    }, 80);

    return () => {
      window.clearInterval(intervalId);
      lastTickSecondRef.current = null;
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
        <p style={{ color: theme.colors.text }}>Session not found</p>
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

  const lightModeBase = [theme.colors.background, '#E8F0FF', '#DCE8FF'] as const;
  const lightModeRest = ['#E8F8F0', '#D7F1E4', '#C7EAD8'] as const;
  const lightModeWorkCritical = ['#FFEDEE', '#FFDCDC', '#FFCCCC'] as const;
  const lightModeRestCritical = ['#EAF9F0', '#D4F3E2', '#BEECD4'] as const;

  const gradientColors = theme.isDark
    ? isRestCritical
      ? ['#0D2D1F', '#114530', '#1B5D43']
      : isWorkCritical
        ? ['#2D1017', '#3A121C', '#591A27']
        : isRestPhase
          ? ['#0A1D17', '#0F2E24', '#1A4637']
          : [theme.colors.background, '#0A1C3E', '#132446']
    : isRestCritical
      ? [...lightModeRestCritical]
      : isWorkCritical
        ? [...lightModeWorkCritical]
        : isRestPhase
          ? [...lightModeRest]
          : [...lightModeBase];

  const controlBtnStyle = { flex: 1, minHeight: 72 };

  return (
    <div
      className="app-shell"
      style={{
        background: toGradient(gradientColors),
        padding: '54px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minHeight: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PrimaryButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
        <span
          style={{
            flex: 1,
            fontSize: 21,
            fontWeight: 900,
            textAlign: 'center',
            marginRight: 86,
            color: theme.colors.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.name}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <PrimaryButton label="Stop" variant="secondary" onPress={engine.reset} style={controlBtnStyle} />
          {showStart ? <PrimaryButton label="Start" onPress={engine.start} style={controlBtnStyle} /> : null}
          {showPause ? <PrimaryButton label="Pause" onPress={engine.pause} style={controlBtnStyle} /> : null}
          {showResume ? <PrimaryButton label="Resume" onPress={engine.resume} style={controlBtnStyle} /> : null}
          {showRepeat ? (
            <PrimaryButton label="Repeat Session" onPress={engine.repeat} style={controlBtnStyle} />
          ) : null}
        </div>

        {showSkipRound ? (
          <PrimaryButton label="Skip Round (3s)" variant="secondary" onPress={engine.skipRound} />
        ) : null}
        {showSkipRest ? (
          <PrimaryButton label="Skip Rest (3s)" variant="secondary" onPress={engine.skipRest} />
        ) : null}

        {nextPhaseText ? (
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1,
              color: theme.colors.textMuted,
            }}
          >
            {nextPhaseText}
          </p>
        ) : null}
      </div>
    </div>
  );
};
