// Pure display/value-set helpers for the Patient Chart. No JSX, no hooks.

export const ALLERGY_SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
] as const;

export const ALLERGY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'resolved', label: 'Resolved' },
] as const;

export const PROBLEM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const MEDICATION_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'completed', label: 'Completed' },
] as const;

const LABEL_BY_VALUE = (options: ReadonlyArray<{ value: string; label: string }>) => {
  const map = new Map(options.map((option) => [option.value, option.label]));
  return (value: string) => map.get(value) ?? value;
};

export const getAllergySeverityLabel = LABEL_BY_VALUE(ALLERGY_SEVERITY_OPTIONS);
export const getAllergyStatusLabel = LABEL_BY_VALUE(ALLERGY_STATUS_OPTIONS);
export const getProblemStatusLabel = LABEL_BY_VALUE(PROBLEM_STATUS_OPTIONS);
export const getMedicationStatusLabel = LABEL_BY_VALUE(MEDICATION_STATUS_OPTIONS);

// Tailwind tone classes for status/severity badges, kept in one place.
export function getAllergySeverityTone(severity: string): string {
  if (severity === 'severe') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }
  if (severity === 'moderate') {
    return 'border-chart-3/20 bg-chart-3/10 text-chart-3';
  }
  return 'bg-muted/60 text-muted-foreground';
}

export function getClinicalStatusTone(status: string): string {
  if (status === 'active') {
    return 'border-chart-4/20 bg-chart-4/10 text-chart-4';
  }
  return 'bg-muted/60 text-muted-foreground';
}

// Renders an ISO date (`2026-03-01`) or date-time as a stable, locale-independent label.
export function formatChartDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return value;
  }

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthLabel = monthNames[Number(month) - 1] ?? month;

  return `${Number(day)} ${monthLabel} ${year}`;
}
