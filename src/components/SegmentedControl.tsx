// Core
import { memo } from 'react';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
  maxPerRow?: number;
};

function SegmentedControlComponent<T extends string>({
  value,
  onChange,
  options,
  maxPerRow = 3,
}: Props<T>) {
  const { theme } = useTheme();
  const perRow = Math.max(1, Math.min(4, maxPerRow));
  const rows: Option<T>[][] = [];

  for (let index = 0; index < options.length; index += perRow) {
    rows.push(options.slice(index, index + perRow));
  }

  return (
    <div
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceStrong,
        borderRadius: 8,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} style={{ display: 'flex', gap: 6 }}>
          {row.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                style={{
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 10px',
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  backgroundColor: active ? theme.colors.card : 'transparent',
                  borderColor: active ? theme.colors.borderStrong : 'transparent',
                  color: active ? theme.colors.text : theme.colors.textMuted,
                  boxShadow: active ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                }}
              >
                {option.label}
              </button>
            );
          })}
          {row.length < perRow
            ? Array.from({ length: perRow - row.length }).map((_, fillerIndex) => (
                <div key={`filler-${rowIndex}-${fillerIndex}`} style={{ flex: 1 }} />
              ))
            : null}
        </div>
      ))}
    </div>
  );
}

export const SegmentedControl = memo(SegmentedControlComponent) as typeof SegmentedControlComponent;
