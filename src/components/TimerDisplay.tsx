// Core
import { memo } from 'react';

// Components
import { SemiCircularProgress } from '@/components/SemiCircularProgress';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

// Types
import { TimerPhase } from '@/types/models';

type Props = {
  phase: TimerPhase;
  remainingSeconds: number;
  roundLabel: string;
  isCritical?: boolean;
  phaseProgress?: number;
  criticalColor?: string;
  restColor?: string;
};

const phaseLabel: Record<TimerPhase, string> = {
  prep: 'GET READY',
  work: 'WORK',
  rest: 'REST',
  finished: 'FINISHED',
};

const toClockParts = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  return {
    hrs: hrs.toString().padStart(2, '0'),
    mins: mins.toString().padStart(2, '0'),
    secs: secs.toString().padStart(2, '0'),
  };
};

const toClockText = (totalSeconds: number) => {
  const parts = toClockParts(totalSeconds);
  if (parts.hrs !== '00') {
    return `${parts.hrs}:${parts.mins}:${parts.secs}`;
  }
  return `${parts.mins}:${parts.secs}`;
};

const TimerDisplayComponent = ({
  phase,
  remainingSeconds,
  roundLabel,
  isCritical = false,
  phaseProgress = 0,
  criticalColor = '#F05454',
  restColor = '#2FB874',
}: Props) => {
  const { theme } = useTheme();
  const clockText = toClockText(remainingSeconds);
  const phaseColor = isCritical
    ? criticalColor
    : phase === 'work'
      ? theme.colors.primary
      : phase === 'rest'
        ? restColor
        : theme.colors.textMuted;
  const roundBorder = isCritical ? criticalColor : theme.colors.border;
  const roundBackground = isCritical ? `${criticalColor}22` : theme.colors.surface;
  const progressPercent = Math.round(Math.min(1, Math.max(0, phaseProgress)) * 100);

  return (
    <div
      className="timer-display"
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
    >
      <div
        className="timer-card"
        style={{
          width: '100%',
          maxWidth: 388,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: roundBorder,
          borderRadius: 8,
          backgroundColor: theme.colors.card,
          padding: '24px 18px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          boxShadow: theme.colors.shadow,
        }}
      >
        <div
          style={{
            minHeight: 34,
            borderRadius: 999,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: roundBorder,
            backgroundColor: roundBackground,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: phaseColor,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 1.4,
          }}
        >
          {phaseLabel[phase]}
        </div>

        {(phase === 'work' || phase === 'rest') && (
          <div className="timer-progress-wrap">
            <SemiCircularProgress
              progress={phaseProgress}
              color={phaseColor}
              trackColor={theme.colors.surfaceMuted}
              size={252}
              strokeWidth={12}
            />
          </div>
        )}

        <div
          className="timer-clock"
          style={{
            marginTop: phase === 'work' || phase === 'rest' ? -62 : 0,
            textAlign: 'center',
            color: isCritical ? criticalColor : theme.colors.text,
            fontSize: clockText.length > 5 ? 58 : 76,
            fontWeight: 950,
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {clockText}
        </div>

        <div
          className="timer-meta"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            color: theme.colors.textMuted,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <span>{roundLabel}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
};

export const TimerDisplay = memo(TimerDisplayComponent);
