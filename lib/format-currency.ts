export function formatAedCompact(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    const maximumFractionDigits = absoluteValue >= 10_000_000 ? 1 : 2;
    const formatted = (value / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    });

    return `AED ${formatted}M`;
  }

  if (absoluteValue >= 1_000) {
    const roundedThousands = Math.round(value / 1_000);

    if (Math.abs(roundedThousands) >= 1_000) {
      return formatAedCompact(roundedThousands * 1_000);
    }

    return `AED ${roundedThousands.toLocaleString('en-US')}K`;
  }

  return `AED ${value.toLocaleString('en-US')}`;
}
