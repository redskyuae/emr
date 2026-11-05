export function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) || parsedValue < 1 ? fallback : parsedValue;
}

export function parseIsActive(value: string | null): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}
