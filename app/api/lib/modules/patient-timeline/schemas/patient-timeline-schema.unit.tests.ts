import { describe, expect, it } from 'vitest';

import {
  TIMELINE_DEFAULT_LIMIT,
  TIMELINE_FEED_SOURCES,
  TIMELINE_MAX_LIMIT,
  TIMELINE_SOURCES,
  decodeTimelineCursor,
  encodeTimelineCursor,
  patientTimelineFeedSchema,
  patientTimelineLimitSchema,
  patientTimelinePatientIdSchema,
  patientTimelineTenantIdSchema,
} from './patient-timeline-schema';

describe('Patient timeline schema', () => {
  describe('patientTimelinePatientIdSchema', () => {
    it('should coerce a numeric string to a number', () => {
      expect(patientTimelinePatientIdSchema.parse('7')).toBe(7);
    });

    it('should reject a non-positive patient id', () => {
      expect(patientTimelinePatientIdSchema.safeParse(0).success).toBe(false);
      expect(patientTimelinePatientIdSchema.safeParse(-3).success).toBe(false);
    });

    it('should reject a non-numeric patient id', () => {
      expect(patientTimelinePatientIdSchema.safeParse('abc').success).toBe(false);
    });
  });

  describe('patientTimelineTenantIdSchema', () => {
    it('should trim a tenant id', () => {
      expect(patientTimelineTenantIdSchema.parse('  tenant-a  ')).toBe('tenant-a');
    });

    it('should reject an empty tenant id', () => {
      expect(patientTimelineTenantIdSchema.safeParse('   ').success).toBe(false);
    });
  });

  describe('patientTimelineFeedSchema', () => {
    it('should default to all when the feed is absent', () => {
      expect(patientTimelineFeedSchema.parse(undefined)).toBe('all');
    });

    it('should accept every supported feed', () => {
      expect(patientTimelineFeedSchema.parse('billing')).toBe('billing');
      expect(patientTimelineFeedSchema.parse('records')).toBe('records');
      expect(patientTimelineFeedSchema.parse('encounters')).toBe('encounters');
    });

    it('should reject an unknown feed', () => {
      expect(patientTimelineFeedSchema.safeParse('clinical').success).toBe(false);
    });
  });

  describe('patientTimelineLimitSchema', () => {
    it('should default to 20 when the limit is absent', () => {
      expect(patientTimelineLimitSchema.parse(undefined)).toBe(TIMELINE_DEFAULT_LIMIT);
    });

    it('should accept the maximum limit', () => {
      expect(patientTimelineLimitSchema.parse(TIMELINE_MAX_LIMIT)).toBe(TIMELINE_MAX_LIMIT);
    });

    it('should reject a limit above the maximum', () => {
      expect(patientTimelineLimitSchema.safeParse(TIMELINE_MAX_LIMIT + 1).success).toBe(false);
    });

    it('should reject a non-positive limit', () => {
      expect(patientTimelineLimitSchema.safeParse(0).success).toBe(false);
    });
  });

  describe('TIMELINE_FEED_SOURCES', () => {
    it('should admit every source under the all feed', () => {
      expect([...TIMELINE_FEED_SOURCES.all].sort()).toEqual([...TIMELINE_SOURCES].sort());
    });

    it('should exclude patient lifecycle events from the category feeds', () => {
      expect(TIMELINE_FEED_SOURCES.billing).not.toContain('PATIENT');
      expect(TIMELINE_FEED_SOURCES.records).not.toContain('PATIENT');
      expect(TIMELINE_FEED_SOURCES.encounters).not.toContain('PATIENT');
    });

    it('should partition the non-patient sources across the category feeds', () => {
      const categorised = [
        ...TIMELINE_FEED_SOURCES.billing,
        ...TIMELINE_FEED_SOURCES.records,
        ...TIMELINE_FEED_SOURCES.encounters,
      ].sort();
      const nonPatient = TIMELINE_SOURCES.filter((source) => source !== 'PATIENT').sort();

      expect(categorised).toEqual(nonPatient);
    });
  });

  describe('timeline cursor', () => {
    const cursor = {
      sourceId: 1042,
      eventType: 'VISIT_COMPLETED' as const,
      occurredAt: '2026-07-20T09:15:00.123900Z',
      sourceType: 'VISIT' as const,
    };

    it('should round-trip a cursor through encode and decode', () => {
      expect(decodeTimelineCursor(encodeTimelineCursor(cursor))).toEqual(cursor);
    });

    it('should produce a cursor that is opaque rather than readable', () => {
      expect(encodeTimelineCursor(cursor)).not.toContain('VISIT');
    });

    it('should reject a cursor that is not valid base64url content', () => {
      expect(decodeTimelineCursor('not-a-cursor')).toBeNull();
    });

    it('should reject a cursor with the wrong number of parts', () => {
      const raw = Buffer.from('2026-07-20T09:15:00.123900Z|VISIT', 'utf8').toString('base64url');

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a cursor that omits the event type', () => {
      const raw = Buffer.from('2026-07-20T09:15:00.123900Z|VISIT|1042', 'utf8').toString(
        'base64url'
      );

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a cursor with an unparseable timestamp', () => {
      const raw = Buffer.from('not-a-date|VISIT|1042|VISIT_COMPLETED', 'utf8').toString(
        'base64url'
      );

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a millisecond-precision instant that would page from a rounded position', () => {
      const raw = Buffer.from(
        '2026-07-20T09:15:00.123Z|VISIT|1042|VISIT_COMPLETED',
        'utf8'
      ).toString('base64url');

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a cursor naming an unknown source', () => {
      const raw = Buffer.from(
        '2026-07-20T09:15:00.123900Z|LAB_ORDER|1042|VISIT_COMPLETED',
        'utf8'
      ).toString('base64url');

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a cursor naming an unknown event type', () => {
      const raw = Buffer.from(
        '2026-07-20T09:15:00.123900Z|VISIT|1042|VISIT_REOPENED',
        'utf8'
      ).toString('base64url');

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should reject a cursor with a non-positive source id', () => {
      const raw = Buffer.from(
        '2026-07-20T09:15:00.123900Z|VISIT|0|VISIT_COMPLETED',
        'utf8'
      ).toString('base64url');

      expect(decodeTimelineCursor(raw)).toBeNull();
    });

    it('should preserve every microsecond digit through a round trip', () => {
      const decoded = decodeTimelineCursor(encodeTimelineCursor(cursor));

      expect(decoded?.occurredAt).toBe('2026-07-20T09:15:00.123900Z');
    });

    it('should distinguish two transitions of one record that share an instant', () => {
      const checkedIn = encodeTimelineCursor({ ...cursor, eventType: 'VISIT_CHECKED_IN' });
      const inConsultation = encodeTimelineCursor({
        ...cursor,
        eventType: 'VISIT_IN_CONSULTATION',
      });

      expect(checkedIn).not.toBe(inConsultation);
    });
  });
});
