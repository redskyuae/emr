import { describe, expect, it } from 'vitest';

import { computeOccupancySegments, countBillableDays } from './bed-day-calculator';

const IST = 'Asia/Kolkata';

// 2026-03-10 06:00 IST == 2026-03-10 00:30 UTC
const istDate = (isoLocal: string) => new Date(`${isoLocal}+05:30`);

describe('bed-day calculator', () => {
  describe('countBillableDays', () => {
    it('should bill one day for a same-day admit and discharge', () => {
      const start = istDate('2026-03-10T09:00:00');
      const end = istDate('2026-03-10T18:00:00');
      expect(countBillableDays(start, end, IST)).toBe(1);
    });

    it('should count calendar days across a multi-night stay', () => {
      const start = istDate('2026-03-10T09:00:00');
      const end = istDate('2026-03-13T11:00:00');
      expect(countBillableDays(start, end, IST)).toBe(3);
    });

    it('should count a month boundary correctly', () => {
      const start = istDate('2026-03-30T20:00:00');
      const end = istDate('2026-04-02T08:00:00');
      expect(countBillableDays(start, end, IST)).toBe(3);
    });

    it('should count by IST calendar date, not UTC, near midnight', () => {
      // 2026-03-10 23:00 IST == 17:30 UTC; 2026-03-11 01:00 IST == 2026-03-10 19:30 UTC.
      // In UTC both fall on 2026-03-10 (0 days); in IST they straddle midnight (1 day).
      const start = istDate('2026-03-10T23:00:00');
      const end = istDate('2026-03-11T01:00:00');
      expect(countBillableDays(start, end, IST)).toBe(1);
    });
  });

  describe('computeOccupancySegments', () => {
    it('should return a single segment when there were no transfers', () => {
      const segments = computeOccupancySegments({
        admittedAt: istDate('2026-03-10T09:00:00'),
        dischargedAt: istDate('2026-03-12T09:00:00'),
        currentBedId: 5,
        transfers: [],
      });

      expect(segments).toEqual([
        {
          bedId: 5,
          start: istDate('2026-03-10T09:00:00'),
          end: istDate('2026-03-12T09:00:00'),
        },
      ]);
    });

    it('should split a multi-day stay at the transfer with no double-billed night', () => {
      // admit Mar10, transfer Mar11, discharge Mar13: 3 nights total (10, 11, 12).
      // Each night is billed to exactly one Bed — the departing segment's count
      // stops at the transfer instant and the arriving segment's count starts
      // there, so they partition the stay rather than overlap on Mar11.
      const admittedAt = istDate('2026-03-10T09:00:00');
      const transferAt = istDate('2026-03-11T14:00:00');
      const dischargedAt = istDate('2026-03-13T09:00:00');

      const segments = computeOccupancySegments({
        admittedAt,
        dischargedAt,
        currentBedId: 9,
        transfers: [{ fromBedId: 5, toBedId: 9, transferredAt: transferAt }],
      });

      expect(segments).toEqual([
        { bedId: 5, start: admittedAt, end: transferAt },
        { bedId: 9, start: transferAt, end: dischargedAt },
      ]);
      const departingDays = countBillableDays(segments[0].start, segments[0].end, IST);
      const arrivingDays = countBillableDays(segments[1].start, segments[1].end, IST);
      expect(departingDays).toBe(1);
      expect(arrivingDays).toBe(2);
      expect(departingDays + arrivingDays).toBe(3);
    });

    it('should bill the same calendar day to both Beds only for a same-day transfer (ADR 0040)', () => {
      // Admit, transfer, and discharge all within one calendar day: both
      // segments are zero-length and each floors up to 1 day, so — unlike the
      // multi-day case above — the one shared day is billed on both Beds.
      const admittedAt = istDate('2026-03-10T09:00:00');
      const transferAt = istDate('2026-03-10T14:00:00');
      const dischargedAt = istDate('2026-03-10T18:00:00');

      const segments = computeOccupancySegments({
        admittedAt,
        dischargedAt,
        currentBedId: 9,
        transfers: [{ fromBedId: 5, toBedId: 9, transferredAt: transferAt }],
      });

      const departingDays = countBillableDays(segments[0].start, segments[0].end, IST);
      const arrivingDays = countBillableDays(segments[1].start, segments[1].end, IST);
      expect(departingDays).toBe(1);
      expect(arrivingDays).toBe(1);
    });

    it('should order unsorted transfers by time before segmenting', () => {
      const admittedAt = istDate('2026-03-10T09:00:00');
      const firstTransfer = istDate('2026-03-11T10:00:00');
      const secondTransfer = istDate('2026-03-12T10:00:00');
      const dischargedAt = istDate('2026-03-13T10:00:00');

      const segments = computeOccupancySegments({
        admittedAt,
        dischargedAt,
        currentBedId: 7,
        transfers: [
          { fromBedId: 6, toBedId: 7, transferredAt: secondTransfer },
          { fromBedId: 5, toBedId: 6, transferredAt: firstTransfer },
        ],
      });

      expect(segments.map((segment) => segment.bedId)).toEqual([5, 6, 7]);
      expect(segments[2].end).toEqual(dischargedAt);
    });
  });
});
