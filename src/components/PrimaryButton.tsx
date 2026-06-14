// Core
import { CSSProperties, memo } from 'react';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
};

const PrimaryButtonComponent = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
  style,
}: Props) => {
  const { theme } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'ghost'
          ? 'transparent'
          : theme.colors.surfaceStrong;

  const textColor =
    variant === 'primary'
      ? theme.colors.primaryText
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'ghost'
          ? theme.colors.textMuted
          : theme.colors.text;

  const minHeight = size === 'lg' ? 60 : size === 'sm' ? 40 : 48;
  const fontSize = size === 'lg' ? 17 : size === 'sm' ? 14 : 15;

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        minHeight,
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'sm' ? '0 12px' : '0 16px',
        fontWeight: 800,
        fontSize,
        backgroundColor,
        color: textColor,
        borderColor:
          variant === 'secondary' || variant === 'ghost' ? theme.colors.border : 'transparent',
        opacity: disabled ? 0.5 : 1,
        boxShadow:
          variant === 'primary'
            ? theme.isDark
              ? '0 12px 26px rgba(110, 168, 255, 0.18)'
              : '0 12px 28px rgba(34, 88, 216, 0.22)'
            : 'none',
        transition: 'background-color 0.15s ease, opacity 0.15s ease, transform 0.05s ease',
        ...style,
      }}
    >
      {label}
    </button>
  );
};

export const PrimaryButton = memo(PrimaryButtonComponent);
