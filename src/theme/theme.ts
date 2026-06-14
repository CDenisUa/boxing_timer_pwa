export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  border: string;
  danger: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: '#EEF3FA',
    card: '#FFFFFF',
    text: '#0B1630',
    textMuted: '#6E7F9B',
    primary: '#2A67E8',
    primaryText: '#FFFFFF',
    border: '#CFD8E8',
    danger: '#D94F4F',
    surface: '#F5F8FD',
    surfaceStrong: '#E7EEF9',
    surfaceMuted: '#DEE7F6',
  },
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#071533',
    card: '#132446',
    text: '#F2F6FF',
    textMuted: '#8DA1C8',
    primary: '#2366EE',
    primaryText: '#F7FAFF',
    border: '#28477B',
    danger: '#C74C67',
    surface: '#0F1E3B',
    surfaceStrong: '#1A2C52',
    surfaceMuted: '#243A68',
  },
};
