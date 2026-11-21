import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import type { PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateAmendVisitVitalSign } from '../validator/amend-visit-vital-sign-validator';
import { amendVisitVitalSignCommand } from './amend-visit-vital-sign-command';

vi.mock('../repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: { updatePatientVitalSign: vi.fn() },
}));
vi.mock('../validator/amend-visit-vital-sign-validator', () => ({
  validateAmendVisitVitalSign: vi.fn(),
}));

const repo = vi.mocked(patientVitalSignRepository);
const validateAmend = vi.mocked(validateAmendVisitVitalSign);

const existingRecordedAt = new Date('2026-07-16T04:30:00.000Z');
const visitCompletedAt = new Date('2026-07-15T11:00:00.000Z');
const amendedReading = { id: 8, visitId: 1, recordedAt: existingRecordedAt } as PatientVitalSign;

describe('amendVisitVitalSignCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAmend.mockResolvedValue({
      success: true,
      data: {
        id: 8,
        payload: { heightCm: 170, weightKg: 65 },
        existingRecordedAt,
        visitCompletedAt,
      },
    });
    repo.updatePatientVitalSign.mockResolvedValue(amendedReading);
  });

  it('should validate first with the raw ids, payload, and Tenant', async () => {
    await amendVisitVitalSignCommand('1', '8', 'tenant-1', { pulseBpm: 72 });

    expect(validateAmend).toHaveBeenCalledWith('1', '8', { pulseBpm: 72 }, 'tenant-1');
  });

  it('should return the validation failure and not write', async () => {
    validateAmend.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(amendVisitVitalSignCommand('1', '8', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.updatePatientVitalSign).not.toHaveBeenCalled();
  });

  it('should recompute BMI and keep the original recordedAt when it is omitted', async () => {
    await expect(amendVisitVitalSignCommand('1', '8', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: amendedReading,
      visitCompletedAt,
    });
    expect(repo.updatePatientVitalSign).toHaveBeenCalledWith(8, {
      heightCm: 170,
      weightKg: 65,
      bmi: 22.5,
      tenantId: 'tenant-1',
      recordedAt: existingRecordedAt,
    });
  });

  it('should use a corrected recordedAt when one is supplied', async () => {
    const corrected = new Date('2026-07-16T05:00:00.000Z');
    validateAmend.mockResolvedValue({
      success: true,
      data: {
        id: 8,
        payload: { pulseBpm: 72, recordedAt: corrected },
        existingRecordedAt,
        visitCompletedAt,
      },
    });

    await amendVisitVitalSignCommand('1', '8', 'tenant-1', {});

    expect(repo.updatePatientVitalSign).toHaveBeenCalledWith(8, {
      pulseBpm: 72,
      bmi: undefined,
      tenantId: 'tenant-1',
      recordedAt: corrected,
    });
  });

  it('should return not found when the reading disappears before the write', async () => {
    repo.updatePatientVitalSign.mockResolvedValue(undefined);

    await expect(amendVisitVitalSignCommand('1', '8', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Vital sign not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });
});
