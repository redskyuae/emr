import { z } from 'zod';

// The kind of record a Timeline Event was derived from. A fixed system set, not
// a Tenant-scoped Master — see CONTEXT.md "Timeline Event Source".
export const TIMELINE_SOURCES = [
  'PATIENT',
  'PAYMENT',
  'INVOICE',
  'VISIT',
  'ADMISSION',
  'APPOINTMENT',
  'BED_TRANSFER',
  'CLINICAL_NOTE',
  'VISIT_DOCUMENT',
] as const;

export type TimelineSource = (typeof TIMELINE_SOURCES)[number];

// One entry per lifecycle transition, not per record (ADR 0041): a Visit that was
// checked in, seen and completed contributes three of these.
export const TIMELINE_EVENT_TYPES = [
  'VISIT_CANCELLED',
  'VISIT_COMPLETED',
  'VISIT_CHECKED_IN',
  'INVOICE_VOIDED',
  'BED_TRANSFERRED',
  'PAYMENT_RECEIVED',
  'INVOICE_FINALIZED',
  'PATIENT_REGISTERED',
  'DOCUMENTS_UPLOADED',
  'APPOINTMENT_BOOKED',
  'PATIENT_DEACTIVATED',
  'PATIENT_REACTIVATED',
  'ADMISSION_ADMITTED',
  'ADMISSION_CANCELLED',
  'ADMISSION_DISCHARGED',
  'CLINICAL_NOTE_SIGNED',
  'APPOINTMENT_CANCELLED',
  'VISIT_IN_CONSULTATION',
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const TIMELINE_FEEDS = ['all', 'billing', 'records', 'encounters'] as const;

export type TimelineFeed = (typeof TIMELINE_FEEDS)[number];

// Which sources each filter chip admits. `all` is every source; PATIENT events are
// lifecycle bookends rather than a category, so they appear only under `all`.
export const TIMELINE_FEED_SOURCES: Record<TimelineFeed, readonly TimelineSource[]> = {
  all: TIMELINE_SOURCES,
  billing: ['INVOICE', 'PAYMENT'],
  records: ['CLINICAL_NOTE', 'VISIT_DOCUMENT'],
  encounters: ['APPOINTMENT', 'VISIT', 'ADMISSION', 'BED_TRANSFER'],
};

export const TIMELINE_DEFAULT_LIMIT = 20;
export const TIMELINE_MAX_LIMIT = 50;

export const patientTimelinePatientIdSchema = z.coerce
  .number({ error: 'Patient ID is required' })
  .int('Patient ID must be an integer')
  .positive('Patient ID must be positive');

export const patientTimelineTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export const patientTimelineFeedSchema = z
  .enum(TIMELINE_FEEDS, { error: 'Feed must be one of all, billing, records, encounters' })
  .default('all');

export const patientTimelineLimitSchema = z.coerce
  .number()
  .int('Limit must be an integer')
  .positive('Limit must be positive')
  .max(TIMELINE_MAX_LIMIT, `Limit cannot exceed ${TIMELINE_MAX_LIMIT}`)
  .default(TIMELINE_DEFAULT_LIMIT);

// `eventType` is part of the key, not decoration: two transitions of one record can
// land on the same stored instant (a Visit checked in and moved into consultation
// together), and without it those rows share an identical key — the strict `<`
// predicate would drop one of them for good at a page boundary.
export type TimelineCursor = {
  sourceId: number;
  eventType: TimelineEventType;
  occurredAt: Date;
  sourceType: TimelineSource;
};

export type PatientTimelineParams = {
  feed: TimelineFeed;
  limit: number;
  cursor: TimelineCursor | null;
  tenantId: string;
  patientId: number;
};

// The cursor is opaque to clients: it encodes a position in the merged ordering,
// which is what makes the feed immune to rows shifting as new events arrive at
// the top (ADR 0041). Never parse it in the UI.
export function encodeTimelineCursor(cursor: TimelineCursor): string {
  const raw = [
    cursor.occurredAt.toISOString(),
    cursor.sourceType,
    cursor.sourceId,
    cursor.eventType,
  ].join('|');

  return Buffer.from(raw, 'utf8').toString('base64url');
}

export function decodeTimelineCursor(value: string): TimelineCursor | null {
  let raw: string;

  try {
    raw = Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const parts = raw.split('|');

  if (parts.length !== 4) {
    return null;
  }

  const [occurredAtPart, sourcePart, sourceIdPart, eventTypePart] = parts;
  const occurredAt = new Date(occurredAtPart);
  const sourceId = Number(sourceIdPart);

  if (Number.isNaN(occurredAt.getTime())) {
    return null;
  }

  if (!TIMELINE_SOURCES.includes(sourcePart as TimelineSource)) {
    return null;
  }

  if (!TIMELINE_EVENT_TYPES.includes(eventTypePart as TimelineEventType)) {
    return null;
  }

  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return null;
  }

  return {
    sourceId,
    eventType: eventTypePart as TimelineEventType,
    occurredAt,
    sourceType: sourcePart as TimelineSource,
  };
}

// The flat, nullable-padded row every UNION ALL branch projects. Display strings
// are never built in SQL — the query layer maps this into TimelineEvent and the
// UI owns all wording (ADR 0041).
export type TimelineEventRow = {
  amount: string | null;
  detail: string | null;
  parentId: number | null;
  sourceId: number;
  reference: string | null;
  eventType: TimelineEventType;
  occurredAt: Date;
  doctorName: string | null;
  sourceType: TimelineSource;
  detailCount: number | null;
};

type TimelineEventBase = {
  sourceId: number;
  eventType: TimelineEventType;
  occurredAt: string;
  reference: string | null;
};

// `sourceId` is the record the event links to. For VISIT_DOCUMENT that is the
// Visit, not a document — the branch is grouped per Visit (ADR 0041), so there is
// no single document row to point at. `parentId` carries the owning record where
// the link target differs from the source: a Payment links to its Invoice, a Bed
// Transfer to its Admission.
export type TimelineEvent = TimelineEventBase &
  (
    | { sourceType: 'PATIENT' }
    | { sourceType: 'CLINICAL_NOTE'; detail: string | null }
    | { sourceType: 'INVOICE'; amount: number | null }
    | { sourceType: 'BED_TRANSFER'; detail: string | null; parentId: number }
    | { sourceType: 'PAYMENT'; amount: number | null; detail: string | null; parentId: number }
    | { sourceType: 'VISIT_DOCUMENT'; detail: string | null; detailCount: number }
    | { sourceType: 'APPOINTMENT'; detail: string | null; doctorName: string | null }
    | { sourceType: 'VISIT'; doctorName: string | null }
    | { sourceType: 'ADMISSION'; doctorName: string | null }
  );
