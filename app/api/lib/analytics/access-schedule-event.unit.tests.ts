import { describe, expect, it } from 'vitest';

import { scheduleChangedProperties } from './access-schedule-event';

const rota = { rotaId: 1, rotaName: 'Morning', rotaTime: '09:00 - 13:00' };

describe('scheduleChangedProperties', () => {
  it('should count the rotas and the days the schedule spans, both dates included', () => {
    expect(
      scheduleChangedProperties('doctor', 'created', {
        slotFromDate: '2026-11-01',
        slotToDate: '2026-11-30',
        rotaDetails: [rota, rota],
      })
    ).toEqual({ action: 'created', span_days: 30, rota_count: 2, schedule_kind: 'doctor' });
  });

  it('should count a single-day schedule as one day', () => {
    expect(
      scheduleChangedProperties('therapist', 'updated', {
        slotFromDate: '2026-11-21',
        slotToDate: '2026-11-21',
        rotaDetails: [rota],
      })
    ).toMatchObject({ span_days: 1, schedule_kind: 'therapist', action: 'updated' });
  });

  it('should never return a negative or unreadable span', () => {
    expect(
      scheduleChangedProperties('doctor', 'updated', {
        slotFromDate: '2026-11-21',
        slotToDate: '2026-11-01',
        rotaDetails: [],
      })
    ).toMatchObject({ span_days: 0, rota_count: 0 });
    expect(
      scheduleChangedProperties('doctor', 'updated', {
        slotFromDate: 'not a date',
        slotToDate: '2026-11-01',
        rotaDetails: [],
      })
    ).toMatchObject({ span_days: 0 });
  });

  it('should send no Doctor, rota or date details', () => {
    const properties = scheduleChangedProperties('doctor', 'created', {
      slotFromDate: '2026-11-01',
      slotToDate: '2026-11-07',
      rotaDetails: [rota],
      doctorId: 7,
    } as never);

    expect(Object.keys(properties).sort()).toEqual([
      'action',
      'rota_count',
      'schedule_kind',
      'span_days',
    ]);
  });
});
