import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientTimelineRepository } from '../repository/patient-timeline-repository';
import { decodeTimelineCursor, type TimelineEventRow } from '../schemas/patient-timeline-schema';
import { validateGetPatientTimeline } from '../validator/get-patient-timeline-validator';
import { getPatientTimelineQuery } from './get-patient-timeline-query';

vi.mock('../repository/patient-timeline-repository', () => ({
  patientTimelineRepository: { getPatientTimeline: vi.fn() },
}));

vi.mock('../validator/get-patient-timeline-validator', () => ({
  validateGetPatientTimeline: vi.fn(),
}));

const timelineRepo = patientTimelineRepository as typeof patientTimelineRepository & {
  getPatientTimeline: Mock<typeof patientTimelineRepository.getPatientTimeline>;
};

const validate = validateGetPatientTimeline as Mock<typeof validateGetPatientTimeline>;

function row(overrides: Partial<TimelineEventRow> = {}): TimelineEventRow {
  return {
    amount: null,
    detail: null,
    parentId: null,
    sourceId: 1,
    reference: 'VST-1042',
    eventType: 'VISIT_COMPLETED',
    occurredAt: new Date('2026-07-20T09:15:00.000Z'),
    doctorName: 'Dr. Rao',
    sourceType: 'VISIT',
    detailCount: null,
    ...overrides,
  };
}

function validationSuccess(limit = 20) {
  return {
    success: true as const,
    data: { feed: 'all' as const, limit, cursor: null, tenantId: 'tenant-1', patientId: 7 },
  };
}

describe('PatientTimeline queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue(validationSuccess());
    timelineRepo.getPatientTimeline.mockResolvedValue([]);
  });

  it('should not call the repository when validation fails', async () => {
    validate.mockResolvedValue({ success: false, errors: ['Patient abc is Invalid.'] });

    const result = await getPatientTimelineQuery('abc', 'tenant-1');

    expect(result).toMatchObject({ success: false, errors: ['Patient abc is Invalid.'] });
    expect(timelineRepo.getPatientTimeline).not.toHaveBeenCalled();
  });

  it('should propagate the validation status', async () => {
    validate.mockResolvedValue({ success: false, errors: ['Patient not found'], status: 404 });

    const result = await getPatientTimelineQuery('99', 'tenant-1');

    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return an empty page with no cursor for a patient with no events', async () => {
    const result = await getPatientTimelineQuery('7', 'tenant-1');

    expect(result).toEqual({ success: true, data: { data: [], meta: { nextCursor: null } } });
  });

  it('should return a null cursor when the page is not full', async () => {
    timelineRepo.getPatientTimeline.mockResolvedValue([row(), row({ sourceId: 2 })]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    expect(result).toMatchObject({ success: true, data: { meta: { nextCursor: null } } });
  });

  it('should drop the probe row and emit a cursor when a further page exists', async () => {
    validate.mockResolvedValue(validationSuccess(2));
    timelineRepo.getPatientTimeline.mockResolvedValue([
      row({ sourceId: 1 }),
      row({ sourceId: 2 }),
      row({ sourceId: 3 }),
    ]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.data).toHaveLength(2);
    expect(result.data.data.map((event) => event.sourceId)).toEqual([1, 2]);
    expect(result.data.meta.nextCursor).not.toBeNull();
  });

  it('should build the next cursor from the last returned row, not the probe row', async () => {
    validate.mockResolvedValue(validationSuccess(2));
    timelineRepo.getPatientTimeline.mockResolvedValue([
      row({ sourceId: 1 }),
      row({ sourceId: 2, occurredAt: new Date('2026-07-19T08:00:00.000Z') }),
      row({ sourceId: 3, occurredAt: new Date('2026-07-18T08:00:00.000Z') }),
    ]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    if (!result.success || !result.data.meta.nextCursor) {
      throw new Error('expected a next cursor');
    }

    expect(decodeTimelineCursor(result.data.meta.nextCursor)).toEqual({
      occurredAt: new Date('2026-07-19T08:00:00.000Z'),
      sourceType: 'VISIT',
      sourceId: 2,
    });
  });

  it('should map a visit row to a visit event carrying the doctor as context', async () => {
    timelineRepo.getPatientTimeline.mockResolvedValue([row()]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    if (!result.success) {
      throw new Error('expected success');
    }

    expect(result.data.data[0]).toEqual({
      sourceId: 1,
      eventType: 'VISIT_COMPLETED',
      occurredAt: '2026-07-20T09:15:00.000Z',
      reference: 'VST-1042',
      sourceType: 'VISIT',
      doctorName: 'Dr. Rao',
    });
  });

  it('should coerce the numeric amount on billing events to a number', async () => {
    timelineRepo.getPatientTimeline.mockResolvedValue([
      row({
        sourceType: 'INVOICE',
        eventType: 'INVOICE_FINALIZED',
        reference: 'INV-1233',
        amount: '8000.00',
        doctorName: null,
      }),
    ]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    if (!result.success) {
      throw new Error('expected success');
    }

    expect(result.data.data[0]).toMatchObject({ sourceType: 'INVOICE', amount: 8000 });
  });

  it('should carry the owning invoice id on a payment event', async () => {
    timelineRepo.getPatientTimeline.mockResolvedValue([
      row({
        sourceType: 'PAYMENT',
        eventType: 'PAYMENT_RECEIVED',
        reference: 'RCP-1001',
        amount: '5000.00',
        detail: 'UPI',
        parentId: 1233,
        doctorName: null,
      }),
    ]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    if (!result.success) {
      throw new Error('expected success');
    }

    expect(result.data.data[0]).toMatchObject({
      sourceType: 'PAYMENT',
      amount: 5000,
      detail: 'UPI',
      parentId: 1233,
    });
  });

  it('should carry the collapse count on a document event', async () => {
    timelineRepo.getPatientTimeline.mockResolvedValue([
      row({
        sourceType: 'VISIT_DOCUMENT',
        eventType: 'DOCUMENTS_UPLOADED',
        detail: null,
        detailCount: 6,
        doctorName: null,
      }),
    ]);

    const result = await getPatientTimelineQuery('7', 'tenant-1');

    if (!result.success) {
      throw new Error('expected success');
    }

    expect(result.data.data[0]).toMatchObject({
      sourceType: 'VISIT_DOCUMENT',
      detailCount: 6,
      detail: null,
    });
  });
});
