export function formatDailyRate(dailyRate: number | null) {
  if (dailyRate === null) {
    return '—';
  }

  return dailyRate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
