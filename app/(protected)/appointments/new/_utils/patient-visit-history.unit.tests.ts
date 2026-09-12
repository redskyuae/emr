import { describe, expect, it } from 'vitest';
import { getRecentVisits } from './patient-visit-history';

describe('Patient Visit history', () => {
  it('should return the three most recent Visits in reverse chronological order', () => {
    const visits = [
      { id: '1', occurredAt: '2026-01-01T09:00:00' },
      { id: '4', occurredAt: '2026-04-01T09:00:00' },
      { id: '2', occurredAt: '2026-02-01T09:00:00' },
      { id: '3', occurredAt: '2026-03-01T09:00:00' },
    ];

    expect(getRecentVisits(visits).map((visit) => visit.id)).toEqual(['4', '3', '2']);
  });

  it('should return an empty list when the Patient has no previous Visits', () => {
    expect(getRecentVisits([])).toEqual([]);
  });
});
