import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import { validateCreateAppointmentType } from './create-appointment-type-validator';
import { validateDeleteAppointmentType } from './delete-appointment-type-validator';
import { validateGetAppointmentTypeById } from './get-appointment-type-by-id-validator';
import { validateGetAppointmentTypes } from './get-appointment-types-validator';
import { validateUpdateAppointmentType } from './update-appointment-type-validator';

vi.mock('../repository/appointment-type-repository', () => ({
  appointmentTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAppointmentTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(appointmentTypeRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAppointmentTypeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAppointmentType({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment type name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAppointmentType({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active appointment type name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAppointmentType(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment type name 'Checkup' already exists."],
    });
  });

  it('should return conflict when active appointment type code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentType(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment type code 'CHK' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentType(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Appointment type name 'Checkup' already exists.",
        "Appointment type code 'CHK' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAppointmentType('7', { name: 'Consultation', code: 'con' }, 'tenant-1');
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Consultation', {
      excludeId: 7,
    });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'CON', { excludeId: 7 });
  });

  it('should return not-found or validation error when requested id is invalid/missing according to existing validator behavior', async () => {
    expect(validateGetAppointmentTypeById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment type abc is Invalid.'],
    });
    repo.getAppointmentTypeById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAppointmentType('1', { name: 'Consultation', code: 'CON' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAppointmentType({ name: ' Checkup ', code: 'chk' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Checkup', code: 'CHK' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentType(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAppointmentType('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAppointmentTypes('  ')).toMatchObject({ success: false });
  });
});
