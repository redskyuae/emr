import { describe, expect, it } from 'vitest';

import { staticVisitList } from '../_data/static-visit-list';
import {
  countActiveFilters,
  datePresetRange,
  filterVisits,
  summarizeVisits,
  type VisitListFilters,
} from './visit-list-filters';

const today = new Date(2026, 9, 27);

const noFilters: VisitListFilters = {
  to: null,
  from: null,
  query: '',
  type: null,
  doctor: null,
  status: null,
  source: null,
  billing: null,
  patientType: null,
};

function filtered(overrides: Partial<VisitListFilters>) {
  return filterVisits(staticVisitList, { ...noFilters, ...overrides }, today);
}

describe('filterVisits', () => {
  it('should return every Visit newest first when no filter is set', () => {
    const rows = filtered({});

    expect(rows).toHaveLength(staticVisitList.length);
    expect(rows[0].dayOffset).toBe(0);
    expect(rows[0].checkedInAt >= rows[1].checkedInAt).toBe(true);
  });

  it('should keep only today for the Today preset', () => {
    const { from, to } = datePresetRange(0, today);

    expect(from).toBe('2026-10-27');
    expect(filtered({ from, to }).every((row) => row.dayOffset === 0)).toBe(true);
  });

  it('should combine Doctor, status and Visit type filters', () => {
    const rows = filtered({ doctor: 'arvind', status: 'COMPLETED', type: 'FUP' });

    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (row) =>
          row.doctor.id === 'arvind' && row.status === 'COMPLETED' && row.visitType.code === 'FUP'
      )
    ).toBe(true);
  });

  it('should separate Appointment Visits from Walk-in Visits', () => {
    const walkIns = filtered({ source: 'walk-in' });
    const booked = filtered({ source: 'appointment' });

    expect(walkIns.every((row) => row.bookingNumber === null)).toBe(true);
    expect(booked.every((row) => row.bookingNumber !== null)).toBe(true);
    expect(walkIns.length + booked.length).toBe(staticVisitList.length);
  });

  it('should match billing status and patient type', () => {
    expect(filtered({ billing: 'PARTIALLY_PAID' }).map((row) => row.visitNumber)).toEqual([
      'VST-1018',
      'VST-1009',
    ]);
    expect(filtered({ patientType: 'New' }).every((row) => row.patientType === 'New')).toBe(true);
  });

  it('should search Visit number, MRN, phone, booking number and invoice number', () => {
    expect(filtered({ query: 'vst-1026' })).toHaveLength(1);
    expect(filtered({ query: 'AYU000110' }).every((row) => row.patient.mrn === 'AYU000110')).toBe(
      true
    );
    expect(filtered({ query: '441 7788' })[0].patient.name).toBe('Priya Nair');
    expect(filtered({ query: 'APT-3041' })[0].visitNumber).toBe('VST-1026');
    expect(filtered({ query: 'inv-2026-002398' })[0].visitNumber).toBe('VST-1018');
  });

  it('should return nothing when filters cannot match', () => {
    expect(filtered({ status: 'CHECKED_IN', billing: 'PAID' })).toEqual([]);
  });
});

describe('Queue Tokens', () => {
  it("should number each Doctor's Visits from 1 in check-in order per day", () => {
    const today = staticVisitList.filter(
      (row) => row.dayOffset === 0 && row.doctor.id === 'arvind'
    );
    const byTime = [...today].sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt));

    expect(byTime.map((row) => row.queueToken)).toEqual([1, 2, 3]);
  });

  it('should issue Visit Numbers in check-in order', () => {
    const todays = staticVisitList
      .filter((row) => row.dayOffset === 0)
      .sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt));

    expect(todays.map((row) => row.id)).toEqual([...todays.map((row) => row.id)].sort());
  });
});

describe('summarizeVisits', () => {
  it('should count Visits by status and total the balance due', () => {
    const summary = summarizeVisits(staticVisitList);

    expect(summary.total).toBe(staticVisitList.length);
    expect(Object.values(summary.byStatus).reduce((sum, count) => sum + count, 0)).toBe(
      summary.total
    );
    expect(summary.balanceDue).toBe(180 + 682.5 + 75);
  });

  it('should flag completed Visits that have not been billed', () => {
    expect(summarizeVisits(staticVisitList).unbilledCompleted).toBe(1);
  });
});

describe('countActiveFilters', () => {
  it('should count the date range once and ignore blank search text', () => {
    expect(countActiveFilters(noFilters)).toBe(0);
    expect(
      countActiveFilters({
        ...noFilters,
        from: '2026-10-20',
        to: '2026-10-27',
        query: '  ',
        doctor: 'nisha',
      })
    ).toBe(2);
  });
});
