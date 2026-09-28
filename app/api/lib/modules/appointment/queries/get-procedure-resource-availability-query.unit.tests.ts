import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../repository/appointment-repository';
import { validateGetProcedureResourceAvailability } from '../validator/get-procedure-resource-availability-validator';
import { getProcedureResourceAvailabilityQuery } from './get-procedure-resource-availability-query';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { getUnavailableProcedureResources: vi.fn() },
}));
vi.mock('../validator/get-procedure-resource-availability-validator', () => ({
  validateGetProcedureResourceAvailability: vi.fn(),
}));

const repo = vi.mocked(appointmentRepository);
const validate = vi.mocked(validateGetProcedureResourceAvailability);
const params = {
  tenantId: 'tenant-1',
  slotDate: '2099-12-31',
  startTime: '10:00',
  endTime: '11:00',
};

describe('getProcedureResourceAvailabilityQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockReturnValue({ success: true, data: params });
    repo.getUnavailableProcedureResources.mockResolvedValue({
      roomIds: [4],
      therapistIds: [8],
      patientUnavailable: true,
    });
  });

  it('should not query the repository when validation fails', async () => {
    validate.mockReturnValue({ success: false, errors: ['Invalid'] });

    await expect(getProcedureResourceAvailabilityQuery({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getUnavailableProcedureResources).not.toHaveBeenCalled();
  });

  it('should return unavailable Room and Therapist IDs', async () => {
    await expect(getProcedureResourceAvailabilityQuery({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: { roomIds: [4], therapistIds: [8], patientUnavailable: true },
    });
    expect(repo.getUnavailableProcedureResources).toHaveBeenCalledWith(params);
  });
});
