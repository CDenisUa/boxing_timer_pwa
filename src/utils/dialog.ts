// Lightweight web replacements for React Native's Alert.alert.

export const notify = (message: string): void => {
  if (typeof window !== 'undefined') {
    window.alert(message);
  }
};

export const confirmAction = (message: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.confirm(message);
};
