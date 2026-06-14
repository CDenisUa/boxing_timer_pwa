// Core
import { memo, useMemo, useState } from 'react';

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

  const minuteOptions = useMemo(
    () => Array.from({ length: maxMinutes + 1 }, (_, i) => i),
    [maxMinutes],
  );
  const secondOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

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

  const selectStyle = {
    width: '100%',
    height: 160,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: 800,
    textAlign: 'center' as const,
    padding: 4,
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
          borderRadius: 20,
          padding: 14,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, color: theme.colors.textMuted }}>
          {label}
        </span>
        <span style={{ fontSize: 30, fontWeight: 900, color: theme.colors.text }}>{timeText}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Tap to set</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 18,
            zIndex: 50,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 22,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', color: theme.colors.text }}>
              {label}
            </span>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: theme.colors.textMuted,
                  }}
                >
                  MIN
                </div>
                <select
                  size={5}
                  value={minutes}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                  style={selectStyle}
                >
                  {minuteOptions.map((value) => (
                    <option key={value} value={value}>
                      {pad2(value)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: theme.colors.textMuted,
                  }}
                >
                  SEC
                </div>
                <select
                  size={5}
                  value={seconds}
                  onChange={(event) => setSeconds(Number(event.target.value))}
                  style={selectStyle}
                >
                  {secondOptions.map((value) => (
                    <option key={value} value={value}>
                      {pad2(value)}
                    </option>
                  ))}
                </select>
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
