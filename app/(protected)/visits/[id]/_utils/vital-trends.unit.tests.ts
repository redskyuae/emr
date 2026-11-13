import { describe, expect, it } from 'vitest';

import { vitalTrends } from './vital-trends';

function reading(recordedAt: string, values: Partial<Record<string, number | null>> = {}) {
  return {
    recordedAt: new Date(recordedAt),
    systolic: null,
    diastolic: null,
    pulseBpm: null,
    temperatureC: null,
    spo2: null,
    weightKg: null,
    painScore: null,
    ...values,
  };
}

describe('vitalTrends', () => {
  it('should return null when nothing was recorded', () => {
    expect(vitalTrends([])).toBeNull();
  });

  it('should compare the latest reading with the one before it whatever the input order', () => {
    const result = vitalTrends([
      reading('2026-11-12T10:31:00Z', { systolic: 148, diastolic: 92, weightKg: 64.2 }),
      reading('2026-10-29T10:00:00Z', { systolic: 132, diastolic: 86, weightKg: 65 }),
    ]);

    expect(result?.recordedAt.toISOString()).toBe('2026-11-12T10:31:00.000Z');
    expect(result?.previousAt?.toISOString()).toBe('2026-10-29T10:00:00.000Z');
    expect(result?.trends.find((trend) => trend.key === 'bp')).toMatchObject({
      value: '148/92',
      change: '+16/+6',
      attention: true,
      series: [132, 148],
    });
    expect(result?.trends.find((trend) => trend.key === 'weightKg')).toMatchObject({
      value: '64.2',
      change: '−0.8',
      attention: false,
    });
  });

  it('should compare with the last earlier value even when the reading before it skipped that sign', () => {
    const result = vitalTrends([
      reading('2026-10-01T10:00:00Z', { pulseBpm: 70 }),
      reading('2026-10-15T10:00:00Z', { weightKg: 60 }),
      reading('2026-11-01T10:00:00Z', { pulseBpm: 78 }),
    ]);

    expect(result?.trends.find((trend) => trend.key === 'pulseBpm')?.change).toBe('+8');
  });

  it('should leave out signs the latest reading did not record and have no change for a first value', () => {
    const result = vitalTrends([reading('2026-11-01T10:00:00Z', { spo2: 92 })]);

    expect(result?.trends).toEqual([
      { key: 'spo2', label: 'SpO₂ %', value: '92', change: null, attention: true, series: [92] },
    ]);
    expect(result?.previousAt).toBeNull();
  });

  it('should keep only the most recent values for the sparkline', () => {
    const readings = Array.from({ length: 8 }, (_, index) =>
      reading(`2026-10-0${index + 1}T10:00:00Z`, { pulseBpm: 60 + index })
    );

    expect(vitalTrends(readings)?.trends[0].series).toEqual([62, 63, 64, 65, 66, 67]);
  });
});
