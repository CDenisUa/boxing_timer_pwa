// Core
import { CSSProperties, memo } from 'react';

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
  const parts = toClockParts(remainingSeconds);
  const phaseColor = isCritical
    ? criticalColor
    : phase === 'work'
      ? theme.colors.primary
      : phase === 'rest'
        ? restColor
        : theme.colors.textMuted;
  const secondColor = isCritical ? criticalColor : phase === 'rest' ? restColor : theme.colors.primary;
  const cardBorder = isCritical ? criticalColor : theme.colors.border;
  const roundBorder = isCritical ? criticalColor : theme.colors.border;
  const roundBackground = isCritical ? `${criticalColor}22` : theme.colors.surface;

  const timeCardStyle: CSSProperties = {
    width: 104,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: cardBorder,
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
    gap: 4,
    boxShadow: '0 8px 12px rgba(191,210,255,0.14)',
  };

  const timeValueStyle: CSSProperties = { fontSize: 40, fontWeight: 900, lineHeight: 1.05 };
  const unitStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1.1,
    color: theme.colors.textMuted,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      {(phase === 'work' || phase === 'rest') && (
        <div style={{ marginBottom: -18 }}>
          <SemiCircularProgress
            progress={phaseProgress}
            color={phaseColor}
            trackColor={theme.colors.surfaceMuted}
            size={270}
            strokeWidth={11}
          />
        </div>
      )}
      <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: 1.8, color: phaseColor }}>
        {phaseLabel[phase]}
      </span>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={timeCardStyle}>
          <span style={{ ...timeValueStyle, color: theme.colors.text }}>{parts.hrs}</span>
          <span style={unitStyle}>HRS</span>
        </div>

        <span style={{ fontSize: 40, lineHeight: '40px', marginTop: -10, color: theme.colors.textMuted }}>
          :
        </span>

        <div style={timeCardStyle}>
          <span style={{ ...timeValueStyle, color: theme.colors.text }}>{parts.mins}</span>
          <span style={unitStyle}>MIN</span>
        </div>

        <span style={{ fontSize: 40, lineHeight: '40px', marginTop: -10, color: theme.colors.textMuted }}>
          :
        </span>

        <div style={timeCardStyle}>
          <span style={{ ...timeValueStyle, color: secondColor }}>{parts.secs}</span>
          <span style={unitStyle}>SEC</span>
        </div>
      </div>

      <div
        style={{
          minHeight: 54,
          borderRadius: 27,
          borderWidth: 1,
          borderStyle: 'solid',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: roundBackground,
          borderColor: roundBorder,
        }}
      >
        <span style={{ fontSize: 19, fontWeight: 800, color: theme.colors.text }}>{roundLabel}</span>
      </div>
    </div>
  );
};

export const TimerDisplay = memo(TimerDisplayComponent);
