// Core
import { CSSProperties, memo } from 'react';

// Theme
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: CSSProperties;
};

const PrimaryButtonComponent = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: Props) => {
  const { theme } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.surfaceStrong;

  const textColor = variant === 'primary' ? theme.colors.primaryText : theme.colors.text;

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      style={{
        minHeight: 56,
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 18px',
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: 0.2,
        backgroundColor,
        color: textColor,
        borderColor: variant === 'secondary' ? theme.colors.border : 'transparent',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s ease, transform 0.05s ease',
        ...style,
      }}
    >
      {label}
    </button>
  );
};

export const PrimaryButton = memo(PrimaryButtonComponent);
