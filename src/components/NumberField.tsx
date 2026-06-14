// Core
import { ChangeEvent, memo, useCallback, useId } from 'react';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
};

const NumberFieldComponent = ({ label, value, onChange, min = 1 }: Props) => {
  const { theme } = useTheme();
  const inputId = useId();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(parsed)) {
        onChange(min);
        return;
      }
      onChange(Math.max(min, parsed));
    },
    [min, onChange],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        padding: 16,
      }}
    >
      <label
        htmlFor={inputId}
        style={{
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: theme.colors.textMuted,
        }}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={String(value)}
        onChange={handleChange}
        style={{
          height: 52,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.input,
          borderRadius: 8,
          padding: '0 14px',
          fontSize: 20,
          fontWeight: 800,
          color: theme.colors.text,
        }}
      />
    </div>
  );
};

export const NumberField = memo(NumberFieldComponent);
