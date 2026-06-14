export const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value >= 1;

export const isNonEmptyString = (value: string): boolean => value.trim().length > 0;
