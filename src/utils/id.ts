export const createId = (): string => {
  const seed = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${seed}`;
};
