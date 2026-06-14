export const formatSecondsToClock = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '00:00';
  }

  const safe = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
};
