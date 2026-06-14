// Core
import { CSSProperties, memo, useMemo, useState } from 'react';

// Components
import { PrimaryButton } from '@/components/PrimaryButton';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  valueSeconds: number;
  onChange: (nextSeconds: number) => void;
  minSeconds?: number;
  maxMinutes?: number;
};

const toParts = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return {
    minutes: Math.floor(safe / 60),
    seconds: safe % 60,
  };
};

const toSeconds = (minutes: number, seconds: number) => minutes * 60 + seconds;

const pad2 = (value: number) => value.toString().padStart(2, '0');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const commonSecondOptions = [0, 5, 10, 15, 20, 30, 45, 50];

const TimeWheelFieldComponent = ({
  label,
  valueSeconds,
  onChange,
  minSeconds = 1,
  maxMinutes = 99,
}: Props) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const initial = useMemo(() => {
    const parts = toParts(valueSeconds);
    return {
      minutes: Math.min(maxMinutes, parts.minutes),
      seconds: parts.seconds,
    };
  }, [maxMinutes, valueSeconds]);

  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);

  const timeText = `${pad2(initial.minutes)}:${pad2(initial.seconds)}`;
  const draftTimeText = `${pad2(minutes)}:${pad2(seconds)}`;
  const maxSeconds = maxMinutes * 60 + 59;
  const accentSurface = theme.colors.primarySoft;
  const activeAccentSurface = theme.isDark ? theme.colors.surfaceMuted : theme.colors.cardStrong;

  const handleOpen = () => {
    setMinutes(initial.minutes);
    setSeconds(initial.seconds);
    setOpen(true);
  };

  const handleApply = () => {
    const next = Math.max(minSeconds, toSeconds(minutes, seconds));
    onChange(next);
    setOpen(false);
  };

  const setDraftFromTotal = (totalSeconds: number) => {
    const next = toParts(clamp(totalSeconds, minSeconds, maxSeconds));
    setMinutes(next.minutes);
    setSeconds(next.seconds);
  };

  const adjustMinutes = (delta: number) => {
    setDraftFromTotal(toSeconds(minutes + delta, seconds));
  };

  const adjustSeconds = (delta: number) => {
    setDraftFromTotal(toSeconds(minutes, seconds + delta));
  };

  const setExactSeconds = (nextSeconds: number) => {
    setDraftFromTotal(toSeconds(minutes, nextSeconds));
  };

  const controlButtonStyle: CSSProperties = {
    width: 42,
    minWidth: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceStrong,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const stepperRowStyle: CSSProperties = {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const valuePillStyle: CSSProperties = {
    flex: 1,
    minWidth: 44,
    height: 42,
    borderRadius: 6,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 8,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          padding: 16,
          textAlign: 'left',
          minHeight: 112,
          boxShadow: theme.isDark ? 'none' : '0 10px 24px rgba(17, 24, 39, 0.06)',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, color: theme.colors.textMuted }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: theme.colors.text,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {timeText}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: theme.colors.primary }}>Set interval</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: theme.colors.overlay,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '18px 16px max(18px, env(safe-area-inset-bottom))',
            zIndex: 50,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: theme.isDark
                ? '0 22px 60px rgba(0, 0, 0, 0.42)'
                : '0 22px 60px rgba(11, 22, 48, 0.18)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: theme.colors.text }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: theme.colors.textMuted }}>
                  INTERVAL
                </span>
              </div>

              <div
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  backgroundColor: accentSurface,
                  minHeight: 92,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.text,
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
                aria-live="polite"
              >
                {draftTimeText}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8, color: theme.colors.textMuted }}>
                MINUTES
              </span>
              <div style={stepperRowStyle}>
                <button
                  type="button"
                  aria-label="Decrease minutes"
                  onClick={() => adjustMinutes(-1)}
                  style={controlButtonStyle}
                >
                  -
                </button>
                <div style={valuePillStyle}>{pad2(minutes)}</div>
                <button
                  type="button"
                  aria-label="Increase minutes"
                  onClick={() => adjustMinutes(1)}
                  style={controlButtonStyle}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8, color: theme.colors.textMuted }}>
                  SECONDS
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textMuted }}>
                  precise or quick set
                </span>
              </div>

              <div style={stepperRowStyle}>
                <button
                  type="button"
                  aria-label="Decrease seconds by five"
                  onClick={() => adjustSeconds(-5)}
                  style={{ ...controlButtonStyle, fontSize: 18 }}
                >
                  -5
                </button>
                <button
                  type="button"
                  aria-label="Decrease seconds"
                  onClick={() => adjustSeconds(-1)}
                  style={controlButtonStyle}
                >
                  -
                </button>
                <div style={valuePillStyle}>{pad2(seconds)}</div>
                <button
                  type="button"
                  aria-label="Increase seconds"
                  onClick={() => adjustSeconds(1)}
                  style={controlButtonStyle}
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Increase seconds by five"
                  onClick={() => adjustSeconds(5)}
                  style={{ ...controlButtonStyle, fontSize: 18 }}
                >
                  +5
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {commonSecondOptions.map((value) => {
                  const active = seconds === value;
                  const disabled = minutes === 0 && value === 0 && minSeconds > 0;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      onClick={() => setExactSeconds(value)}
                      style={{
                        minHeight: 42,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? activeAccentSurface : theme.colors.surface,
                        color: active ? theme.colors.text : theme.colors.textMuted,
                        fontSize: 15,
                        fontWeight: 900,
                        fontVariantNumeric: 'tabular-nums',
                        opacity: disabled ? 0.45 : 1,
                      }}
                    >
                      {pad2(value)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <PrimaryButton
                label="Cancel"
                variant="secondary"
                onPress={() => setOpen(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton label="Apply" onPress={handleApply} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const TimeWheelField = memo(TimeWheelFieldComponent);
