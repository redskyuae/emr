import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateCreateAppointmentReason } from './create-appointment-reason-validator';

// Mock the uniqueness validator used by create validator
vi.mock('./appointment-reason-uniqueness-validator', () => ({
  validateAppointmentReasonUniqueness: vi.fn(),
}));

import { validateAppointmentReasonUniqueness } from './appointment-reason-uniqueness-validator';

const mockedValidateUniqueness = validateAppointmentReasonUniqueness as ReturnType<typeof vi.fn>;

describe('CreateAppointmentReason validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedValidateUniqueness.mockResolvedValue({ success: true, data: undefined });
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAppointmentReason({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment reason name is required']),
    });
    expect(mockedValidateUniqueness).not.toHaveBeenCalled();
  });

  it('should not call uniqueness check when schema validation fails', async () => {
    await validateCreateAppointmentReason({}, 'tenant-1');
    expect(mockedValidateUniqueness).not.toHaveBeenCalled();
  });

  it('should return conflict when uniqueness check fails for name', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: ["Appointment reason name 'Checkup' already exists."],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateCreateAppointmentReason(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason name 'Checkup' already exists."],
    });
  });

  it('should return conflict when uniqueness check fails for code', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: ["Appointment reason code 'CHK' already exists."],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateCreateAppointmentReason(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason code 'CHK' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code exist', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: [
        "Appointment reason name 'Checkup' already exists.",
        "Appointment reason code 'CHK' already exists.",
      ],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateCreateAppointmentReason(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Appointment reason name 'Checkup' already exists.",
        "Appointment reason code 'CHK' already exists.",
      ],
    });
  });

  it('should return parsed/transformed data on success', async () => {
    const result = await validateCreateAppointmentReason(
      { name: ' Consultation ', code: 'con' },
      'tenant-1'
    );
    expect(result).toEqual({ success: true, data: { name: 'Consultation', code: 'CON' } });
  });

  it('should preserve uniqueness validator status on failure', async () => {
    mockedValidateUniqueness.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateCreateAppointmentReason(
      { name: 'Consultation', code: 'CON' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });
});
