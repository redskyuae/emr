import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '../../visit/schemas/visit-schema';
import { validateVisitForAmendment } from '../../visit/validator/visit-amendment-validator';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import type { PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateAmendVisitVitalSign } from './amend-visit-vital-sign-validator';

vi.mock('../../visit/validator/visit-amendment-validator', () => ({
  validateVisitForAmendment: vi.fn(),
}));
vi.mock('../repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: { getPatientVitalSignById: vi.fn() },
}));

const validateVisit = vi.mocked(validateVisitForAmendment);
const repo = vi.mocked(patientVitalSignRepository);

const recordedAt = new Date('2026-07-16T04:30:00.000Z');
const reading = { id: 8, visitId: 1, recordedAt } as PatientVitalSign;

describe('validateAmendVisitVitalSign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateVisit.mockResolvedValue({ success: true, data: { id: 1 } as Visit });
    repo.getPatientVitalSignById.mockResolvedValue(reading);
  });

  it('should return every invalid id and schema error without repository calls', async () => {
    const result = await validateAmendVisitVitalSign('abc', 'xyz', {}, 'tenant-1');

    expect(result).toMatchObject({ success: false });
    expect(result.success ? [] : result.errors).toEqual(
      expect.arrayContaining([
        'Visit abc is Invalid.',
        'Vital sign xyz is Invalid.',
        'At least one vital sign measurement is required',
      ])
    );
    expect(result).not.toHaveProperty('status');
    expect(validateVisit).not.toHaveBeenCalled();
    expect(repo.getPatientVitalSignById).not.toHaveBeenCalled();
  });

  it('should propagate the Visit guard failure without loading the reading', async () => {
    validateVisit.mockResolvedValue({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await expect(
      validateAmendVisitVitalSign('1', '8', { pulseBpm: 72 }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(validateVisit).toHaveBeenCalledWith(1, 'tenant-1');
    expect(repo.getPatientVitalSignById).not.toHaveBeenCalled();
  });

  it('should return not found when the reading does not exist in the Tenant', async () => {
    repo.getPatientVitalSignById.mockResolvedValue(undefined);

    await expect(
      validateAmendVisitVitalSign('1', '8', { pulseBpm: 72 }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      errors: ['Vital sign not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return not found when the reading belongs to another Visit', async () => {
    repo.getPatientVitalSignById.mockResolvedValue({ ...reading, visitId: 9 });

    await expect(
      validateAmendVisitVitalSign('1', '8', { pulseBpm: 72 }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      errors: ['Vital sign not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should carry the existing recordedAt forward with the validated payload', async () => {
    const result = await validateAmendVisitVitalSign('1', '8', { pulseBpm: 72 }, 'tenant-1');

    expect(result).toMatchObject({
      success: true,
      data: { id: 8, payload: { pulseBpm: 72 }, existingRecordedAt: recordedAt },
    });
    expect(repo.getPatientVitalSignById).toHaveBeenCalledWith(8, 'tenant-1');
  });
});
