import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import { validateCreateAppointmentType } from '../validator/create-appointment-type-validator';
import { validateDeleteAppointmentType } from '../validator/delete-appointment-type-validator';
import { validateUpdateAppointmentType } from '../validator/update-appointment-type-validator';
import { createAppointmentTypeCommand } from './create-appointment-type-command';
import { deleteAppointmentTypeCommand } from './delete-appointment-type-command';
import { updateAppointmentTypeCommand } from './update-appointment-type-command';

vi.mock('../repository/appointment-type-repository', () => ({
  appointmentTypeRepository: {
    createAppointmentType: vi.fn(),
    updateAppointmentType: vi.fn(),
    deleteAppointmentType: vi.fn(),
  },
}));
vi.mock('../validator/create-appointment-type-validator', () => ({
  validateCreateAppointmentType: vi.fn(),
}));
vi.mock('../validator/update-appointment-type-validator', () => ({
  validateUpdateAppointmentType: vi.fn(),
}));
vi.mock('../validator/delete-appointment-type-validator', () => ({
  validateDeleteAppointmentType: vi.fn(),
}));

const repo = vi.mocked(appointmentTypeRepository);
const validateCreate = vi.mocked(validateCreateAppointmentType);
const validateUpdate = vi.mocked(validateUpdateAppointmentType);
const validateDelete = vi.mocked(validateDeleteAppointmentType);
const type = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentType commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Checkup', code: 'CHK', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { name: 'Checkup', code: 'CHK', description: undefined } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAppointmentType.mockResolvedValue(type);
    repo.updateAppointmentType.mockResolvedValue(type);
    repo.deleteAppointmentType.mockResolvedValue(type);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAppointmentTypeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAppointmentType).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAppointmentTypeCommand({}, 'tenant-1');
    expect(repo.createAppointmentType).toHaveBeenCalledWith({
      name: 'Checkup',
      code: 'CHK',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAppointmentTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: type,
    });
    await expect(updateAppointmentTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: type,
    });
    await expect(deleteAppointmentTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: type,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAppointmentType.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_type_tenant_name_idx' },
    });
    await expect(createAppointmentTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment type name 'Checkup' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAppointmentType.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_type_tenant_code_idx' },
    });
    await expect(updateAppointmentTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment type code 'CHK' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAppointmentType.mockRejectedValue(error);
    await expect(createAppointmentTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAppointmentTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
