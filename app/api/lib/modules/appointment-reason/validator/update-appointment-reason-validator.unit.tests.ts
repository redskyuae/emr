import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateUpdateAppointmentReason } from './update-appointment-reason-validator';

// Mock the uniqueness validator and repository
vi.mock('./appointment-reason-uniqueness-validator', () => ({
  validateAppointmentReasonUniqueness: vi.fn(),
}));
vi.mock('../repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: {
    getAppointmentReasonById: vi.fn(),
  },
}));

import { validateAppointmentReasonUniqueness } from './appointment-reason-uniqueness-validator';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';

const mockedValidateUniqueness = vi.mocked(validateAppointmentReasonUniqueness);
const mockedRepo = vi.mocked(appointmentReasonRepository);

const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('UpdateAppointmentReason validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedValidateUniqueness.mockResolvedValue({ success: true, data: undefined });
    mockedRepo.getAppointmentReasonById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateUpdateAppointmentReason('abc', {}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment reason abc is Invalid.']),
    });
  });

  it('should return not found when id is valid but entity does not exist', async () => {
    mockedRepo.getAppointmentReasonById.mockResolvedValue(undefined);
    const result = await validateUpdateAppointmentReason(
      '1',
      { name: 'Consultation', code: 'CON' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment reason not found'],
    });
  });

  it('should call uniqueness with excludeId during update', async () => {
    await validateUpdateAppointmentReason('7', { name: 'Consultation', code: 'con' }, 'tenant-1');
    expect(mockedValidateUniqueness).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      name: 'Consultation',
      code: 'CON',
      excludeId: 7,
    });
  });

  it('should return conflict when uniqueness check fails', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: ["Appointment reason name 'Consultation' already exists."],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateUpdateAppointmentReason(
      '7',
      { name: 'Consultation', code: 'CON' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason name 'Consultation' already exists."],
    });
  });

  it('should return parsed data with id and payload on success', async () => {
    const result = await validateUpdateAppointmentReason(
      '7',
      { name: 'Consultation', code: 'con' },
      'tenant-1'
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: 7,
        payload: { name: 'Consultation', code: 'CON' },
      },
    });
  });

  it('should preserve uniqueness validator status on failure', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateUpdateAppointmentReason(
      '7',
      { name: 'Consultation', code: 'CON' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });
});
