import { describe, expect, it } from 'vitest';

import { previousVisitsFilterFormSchema } from './previous-visits-filter-form-schema';
import {
  countActiveFilters,
  defaultRange,
  formatVisitDay,
  rangeLabel,
  resolveFilters,
  toVisitsParams,
  type PreviousVisitsUrlParams,
} from './previous-visits-filters';

const today = new Date(2026, 6, 16);

const emptyParams: PreviousVisitsUrlParams = {
  q: null,
  to: null,
  from: null,
  type: null,
  doctor: null,
  status: null,
};

describe('previous visits filters', () => {
  describe('defaultRange', () => {
    it('should default to all dates up to today', () => {
      expect(defaultRange(today)).toEqual({ from: null, to: '2026-07-16' });
    });
  });

  describe('resolveFilters', () => {
    it('should default to all dates up to today with no other filters', () => {
      expect(resolveFilters(emptyParams, today)).toEqual({
        from: null,
        to: '2026-07-16',
        query: '',
        status: null,
        doctorId: null,
        visitTypeId: null,
      });
    });

    it('should read every filter from the URL', () => {
      expect(
        resolveFilters(
          {
            q: '  asha ',
            from: '2026-07-01',
            to: '2026-07-10',
            doctor: '3',
            status: 'COMPLETED',
            type: '2',
          },
          today
        )
      ).toEqual({
        from: '2026-07-01',
        to: '2026-07-10',
        query: 'asha',
        status: 'COMPLETED',
        doctorId: '3',
        visitTypeId: '2',
      });
    });

    it('should fall back to the default range when the URL range is inverted', () => {
      expect(
        resolveFilters({ ...emptyParams, from: '2026-07-10', to: '2026-07-01' }, today)
      ).toMatchObject(defaultRange(today));
    });

    it('should ignore malformed dates, ids and statuses', () => {
      expect(
        resolveFilters(
          { ...emptyParams, from: '31-02-2026', doctor: 'abc', type: '0', status: 'PENDING' },
          today
        )
      ).toEqual(resolveFilters(emptyParams, today));
    });
  });

  describe('countActiveFilters', () => {
    it('should count nothing for a fresh page', () => {
      expect(countActiveFilters(resolveFilters(emptyParams, today), today)).toBe(0);
    });

    it('should count a changed range and each set filter once', () => {
      const filters = resolveFilters(
        { q: 'rao', from: '2026-07-01', to: '2026-07-10', doctor: '3', status: null, type: '2' },
        today
      );

      expect(countActiveFilters(filters, today)).toBe(4);
    });
  });

  describe('toVisitsParams', () => {
    it('should convert to the API date format and numeric ids', () => {
      expect(
        toVisitsParams({
          from: '2026-07-01',
          to: '2026-07-10',
          query: 'asha',
          status: 'COMPLETED',
          doctorId: '3',
          visitTypeId: '2',
        })
      ).toEqual({
        fromDate: '01-07-2026',
        toDate: '10-07-2026',
        query: 'asha',
        status: 'COMPLETED',
        doctorId: 3,
        visitTypeId: 2,
      });
    });

    it('should omit empty filters', () => {
      expect(toVisitsParams(resolveFilters(emptyParams, today))).toEqual({
        fromDate: undefined,
        toDate: '16-07-2026',
        query: undefined,
        status: undefined,
        doctorId: undefined,
        visitTypeId: undefined,
      });
    });
  });

  describe('formatting', () => {
    it('should format ISO and API dates for display', () => {
      expect(formatVisitDay('2026-07-16')).toBe('16 Jul 2026');
      expect(formatVisitDay('16-07-2026')).toBe('16 Jul 2026');
    });

    it('should label an open-ended range', () => {
      expect(rangeLabel({ from: null, to: '2026-07-16' })).toBe('All dates up to 16 Jul 2026');
    });

    it('should label a single day and a range', () => {
      expect(rangeLabel({ from: '2026-07-16', to: '2026-07-16' })).toBe('16 Jul 2026');
      expect(rangeLabel({ from: '2026-07-01', to: '2026-07-16' })).toBe('1 Jul 2026 – 16 Jul 2026');
    });
  });

  describe('previousVisitsFilterFormSchema', () => {
    const values = {
      from: '2026-07-01',
      to: '2026-07-16',
      query: '',
      status: 'all',
      doctorId: 'all',
      visitTypeId: 'all',
    };

    it('should accept a valid range', () => {
      expect(previousVisitsFilterFormSchema.safeParse(values).success).toBe(true);
    });

    it('should accept a blank From date for all dates', () => {
      expect(previousVisitsFilterFormSchema.safeParse({ ...values, from: '' }).success).toBe(true);
    });

    it('should require the To date', () => {
      const result = previousVisitsFilterFormSchema.safeParse({ ...values, to: '' });

      expect(result.error?.issues.map((issue) => issue.message)).toEqual(['To date is required']);
    });

    it('should reject an inverted range on the To date', () => {
      const result = previousVisitsFilterFormSchema.safeParse({ ...values, from: '2026-07-17' });

      expect(result.error?.issues).toEqual([
        expect.objectContaining({
          path: ['to'],
          message: 'From date must be on or before To date',
        }),
      ]);
    });
  });
});
