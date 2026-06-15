// Core
import { CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';

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

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5; // odd so one row sits dead-centre
const PAD = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;

const toParts = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

type WheelColumnProps = {
  items: number[];
  value: number;
  unit: string;
  onSelect: (value: number) => void;
};

/**
 * A scroll-snapping picker column. The centred row is the selected value; users
 * can flick-scroll or tap a row (tapping is also what keeps it usable/testable
 * in a layout-less DOM).
 */
const WheelColumn = ({ items, value, unit, onSelect }: WheelColumnProps) => {
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Align to the initial value once on mount.
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.scrollTop = Math.max(0, items.indexOf(value)) * ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (settleRef.current) {
      clearTimeout(settleRef.current);
    }
    settleRef.current = setTimeout(() => {
      const index = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)));
      if (items[index] !== value) {
        onSelect(items[index]);
      }
    }, 90);
  };

  const handleTap = (item: number, index: number) => {
    const el = ref.current;
    if (el) {
      el.scrollTo?.({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      el.scrollTop = index * ITEM_HEIGHT;
    }
    onSelect(item);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{
        position: 'relative',
        height: VISIBLE_ROWS * ITEM_HEIGHT,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        flex: 1,
        scrollbarWidth: 'none',
      }}
    >
      <div style={{ height: PAD }} />
      {items.map((item, index) => {
        const active = item === value;
        return (
          <button
            key={item}
            type="button"
            aria-label={`${item} ${unit}`}
            onClick={() => handleTap(item, index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontVariantNumeric: 'tabular-nums',
              fontSize: active ? 30 : 22,
              fontWeight: 900,
              color: active ? theme.colors.text : theme.colors.textSubtle,
              opacity: active ? 1 : 0.55,
              transition: 'font-size 0.12s ease, opacity 0.12s ease',
            }}
          >
            {pad2(item)}
          </button>
        );
      })}
      <div style={{ height: PAD }} />
    </div>
  );
};

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
    return { minutes: Math.min(maxMinutes, parts.minutes), seconds: parts.seconds };
  }, [maxMinutes, valueSeconds]);

  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);

  const minuteItems = useMemo(() => Array.from({ length: maxMinutes + 1 }, (_, i) => i), [maxMinutes]);
  const secondItems = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const timeText = `${pad2(initial.minutes)}:${pad2(initial.seconds)}`;
  const draftTimeText = `${pad2(minutes)}:${pad2(seconds)}`;

  const handleOpen = () => {
    setMinutes(initial.minutes);
    setSeconds(initial.seconds);
    setOpen(true);
  };

  const handleApply = () => {
    onChange(Math.max(minSeconds, minutes * 60 + seconds));
    setOpen(false);
  };

  const columnLabelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.8,
    color: theme.colors.textMuted,
    textAlign: 'center',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: theme.colors.text }}>{label}</span>
              <span
                aria-live="polite"
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: theme.colors.primary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {draftTimeText}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <span style={columnLabelStyle}>MINUTES</span>
              <span style={columnLabelStyle}>SECONDS</span>
            </div>

            <div
              style={{
                position: 'relative',
                display: 'flex',
                gap: 10,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: theme.colors.border,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                overflow: 'hidden',
              }}
            >
              {/* Centre selection band. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  top: PAD,
                  height: ITEM_HEIGHT,
                  borderRadius: 8,
                  backgroundColor: theme.colors.primarySoft,
                  pointerEvents: 'none',
                }}
              />
              <WheelColumn items={minuteItems} value={minutes} unit="minutes" onSelect={setMinutes} />
              <div aria-hidden style={{ width: 1, backgroundColor: theme.colors.border, alignSelf: 'stretch' }} />
              <WheelColumn items={secondItems} value={seconds} unit="seconds" onSelect={setSeconds} />
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
