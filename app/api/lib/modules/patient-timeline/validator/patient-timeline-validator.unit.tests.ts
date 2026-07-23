import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import {
  TIMELINE_DEFAULT_LIMIT,
  TIMELINE_MAX_LIMIT,
  encodeTimelineCursor,
} from '../schemas/patient-timeline-schema';
import { validateGetPatientTimeline } from './get-patient-timeline-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};

describe('PatientTimeline validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 7 } as never);
  });

  it('should reject an invalid patient id without hitting the repository', async () => {
    const result = await validateGetPatientTimeline('abc', 'tenant-1');

    expect(result).toMatchObject({ success: false });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject an empty tenant id without hitting the repository', async () => {
    const result = await validateGetPatientTimeline('7', '   ');

    expect(result).toMatchObject({ success: false });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject an unknown feed without hitting the repository', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1', { feed: 'clinical' });

    expect(result).toMatchObject({ success: false });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject a limit above the maximum without hitting the repository', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1', {
      limit: TIMELINE_MAX_LIMIT + 1,
    });

    expect(result).toMatchObject({ success: false });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject a malformed cursor rather than throwing', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1', { cursor: 'not-a-cursor' });

    expect(result).toMatchObject({ success: false, errors: ['Cursor is Invalid.'] });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should reject a non-string cursor', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1', { cursor: 42 });

    expect(result).toMatchObject({ success: false, errors: ['Cursor is Invalid.'] });
  });

  it('should return not-found when the patient does not exist', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);

    const result = await validateGetPatientTimeline('7', 'tenant-1');

    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should default the feed to all and the limit to 20 when neither is supplied', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1');

    expect(result).toMatchObject({
      success: true,
      data: {
        feed: 'all',
        limit: TIMELINE_DEFAULT_LIMIT,
        cursor: null,
        tenantId: 'tenant-1',
        patientId: 7,
      },
    });
  });

  it('should treat an empty-string cursor as no cursor', async () => {
    const result = await validateGetPatientTimeline('7', 'tenant-1', { cursor: '' });

    expect(result).toMatchObject({ success: true, data: { cursor: null } });
  });

  it('should decode a well-formed cursor', async () => {
    const occurredAt = '2026-07-20T09:15:00.123900Z';
    const cursor = encodeTimelineCursor({
      sourceId: 1042,
      eventType: 'VISIT_COMPLETED',
      occurredAt,
      sourceType: 'VISIT',
    });

    const result = await validateGetPatientTimeline('7', 'tenant-1', { cursor });

    expect(result).toMatchObject({
      success: true,
      data: {
        cursor: {
          sourceId: 1042,
          eventType: 'VISIT_COMPLETED',
          occurredAt,
          sourceType: 'VISIT',
        },
      },
    });
  });

  it('should accept each supported feed', async () => {
    for (const feed of ['all', 'billing', 'records', 'encounters'] as const) {
      const result = await validateGetPatientTimeline('7', 'tenant-1', { feed });

      expect(result).toMatchObject({ success: true, data: { feed } });
    }
  });
});
