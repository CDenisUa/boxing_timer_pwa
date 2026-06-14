export type ThemeColors = {
  background: string;
  backgroundElevated: string;
  card: string;
  cardStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
  input: string;
  overlay: string;
  shadow: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: '#F4F7FB',
    backgroundElevated: '#EBF1F8',
    card: '#FFFFFF',
    cardStrong: '#F9FBFE',
    text: '#111827',
    textMuted: '#667085',
    textSubtle: '#98A2B3',
    primary: '#2258D8',
    primarySoft: '#E7EEFF',
    primaryText: '#FFFFFF',
    border: '#D8E0EB',
    borderStrong: '#B8C5D6',
    danger: '#D64A5F',
    dangerSoft: '#FFE8EC',
    success: '#159A6C',
    successSoft: '#E1F6ED',
    warning: '#B7791F',
    warningSoft: '#FFF3D6',
    surface: '#F6F8FC',
    surfaceStrong: '#E9EEF6',
    surfaceMuted: '#DDE5F0',
    input: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.58)',
    shadow: '0 18px 50px rgba(17, 24, 39, 0.12)',
  },
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#0C111D',
    backgroundElevated: '#111827',
    card: '#151C2B',
    cardStrong: '#1B2536',
    text: '#F5F7FA',
    textMuted: '#A3AEC2',
    textSubtle: '#6F7C91',
    primary: '#6EA8FF',
    primarySoft: '#172C52',
    primaryText: '#07111F',
    border: '#2A3548',
    borderStrong: '#40506A',
    danger: '#FF6B81',
    dangerSoft: '#3A1821',
    success: '#45D19A',
    successSoft: '#123629',
    warning: '#F0B84F',
    warningSoft: '#3A2A12',
    surface: '#101827',
    surfaceStrong: '#202B3D',
    surfaceMuted: '#2C3A52',
    input: '#101827',
    overlay: 'rgba(2, 6, 23, 0.72)',
    shadow: '0 22px 70px rgba(0, 0, 0, 0.34)',
  },
};
