export function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) || parsedValue < 1 ? fallback : parsedValue;
}
