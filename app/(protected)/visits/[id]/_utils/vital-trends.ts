import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

type VitalReading = Pick<
  PatientVitalSign,
  | 'recordedAt'
  | 'systolic'
  | 'diastolic'
  | 'pulseBpm'
  | 'temperatureC'
  | 'spo2'
  | 'weightKg'
  | 'painScore'
>;

type NumericVital = Exclude<keyof VitalReading, 'recordedAt'>;

export type VitalTrend = {
  key: string;
  label: string;
  value: string;
  change: string | null;
  attention: boolean;
  series: number[];
};

const SERIES_LENGTH = 6;

// Conservative adult screening limits. A flag asks the Doctor to look; it is not a diagnosis.
const SINGLE_VITALS: {
  key: NumericVital;
  label: string;
  suffix?: string;
  attention?: (value: number) => boolean;
}[] = [
  { key: 'pulseBpm', label: 'Pulse bpm', attention: (value) => value < 50 || value > 100 },
  { key: 'temperatureC', label: 'Temp °C', attention: (value) => value < 35 || value >= 38 },
  { key: 'spo2', label: 'SpO₂ %', attention: (value) => value < 94 },
  { key: 'weightKg', label: 'Weight kg' },
  { key: 'painScore', label: 'Pain 0–10', attention: (value) => value >= 7 },
];

function time(reading: VitalReading) {
  return new Date(reading.recordedAt).getTime();
}

function format(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function signed(value: number) {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${format(Math.abs(value))}`;
}

function valuesOf(readings: VitalReading[], key: NumericVital) {
  return readings.flatMap((reading) => (reading[key] === null ? [] : [reading[key] as number]));
}

function bloodPressure(latest: VitalReading, earlier: VitalReading[]): VitalTrend | null {
  if (latest.systolic === null || latest.diastolic === null) return null;

  const previous = [...earlier]
    .reverse()
    .find((reading) => reading.systolic !== null && reading.diastolic !== null);

  return {
    key: 'bp',
    label: 'BP mmHg',
    value: `${latest.systolic}/${latest.diastolic}`,
    change: previous
      ? `${signed(latest.systolic - (previous.systolic as number))}/${signed(
          latest.diastolic - (previous.diastolic as number)
        )}`
      : null,
    attention: latest.systolic >= 140 || latest.diastolic >= 90,
    series: [...valuesOf(earlier, 'systolic'), latest.systolic].slice(-SERIES_LENGTH),
  };
}

/**
 * The latest reading of each Vital Sign, its change since the reading before it,
 * and the recent values behind a sparkline. Readings may come in any order.
 */
export function vitalTrends(readings: VitalReading[]) {
  const ordered = [...readings].sort((a, b) => time(a) - time(b));
  const latest = ordered.at(-1);

  if (!latest) return null;

  const earlier = ordered.slice(0, -1);
  const previousReading = earlier.at(-1) ?? null;
  const trends: VitalTrend[] = [];
  const pressure = bloodPressure(latest, earlier);

  if (pressure) trends.push(pressure);

  for (const vital of SINGLE_VITALS) {
    const value = latest[vital.key];
    if (value === null) continue;

    const before = valuesOf(earlier, vital.key);
    const previous = before.at(-1);

    trends.push({
      key: vital.key,
      label: vital.label,
      value: format(value),
      change: previous === undefined ? null : signed(value - previous),
      attention: vital.attention?.(value) ?? false,
      series: [...before, value].slice(-SERIES_LENGTH),
    });
  }

  return {
    recordedAt: new Date(latest.recordedAt),
    previousAt: previousReading ? new Date(previousReading.recordedAt) : null,
    trends,
  };
}
