import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import { validateCreateAppointmentMode } from '../validator/create-appointment-mode-validator';
import { validateDeleteAppointmentMode } from '../validator/delete-appointment-mode-validator';
import { validateUpdateAppointmentMode } from '../validator/update-appointment-mode-validator';
import { createAppointmentModeCommand } from './create-appointment-mode-command';
import { deleteAppointmentModeCommand } from './delete-appointment-mode-command';
import { updateAppointmentModeCommand } from './update-appointment-mode-command';

vi.mock('../repository/appointment-mode-repository', () => ({
  appointmentModeRepository: {
    createAppointmentMode: vi.fn(),
    updateAppointmentMode: vi.fn(),
    softDeleteAppointmentMode: vi.fn(),
  },
}));
vi.mock('../validator/create-appointment-mode-validator', () => ({
  validateCreateAppointmentMode: vi.fn(),
}));
vi.mock('../validator/update-appointment-mode-validator', () => ({
  validateUpdateAppointmentMode: vi.fn(),
}));
vi.mock('../validator/delete-appointment-mode-validator', () => ({
  validateDeleteAppointmentMode: vi.fn(),
}));

const repo = vi.mocked(appointmentModeRepository);
const validateCreate = vi.mocked(validateCreateAppointmentMode);
const validateUpdate = vi.mocked(validateUpdateAppointmentMode);
const validateDelete = vi.mocked(validateDeleteAppointmentMode);
const mode = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'In Person',
  code: 'IP',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentMode commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: { name: 'In Person', code: 'IP' } });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { name: 'In Person', code: 'IP' } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAppointmentMode.mockResolvedValue(mode);
    repo.updateAppointmentMode.mockResolvedValue(mode);
    repo.softDeleteAppointmentMode.mockResolvedValue(mode);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAppointmentModeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAppointmentMode).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAppointmentModeCommand({}, 'tenant-1');
    expect(repo.createAppointmentMode).toHaveBeenCalledWith({
      name: 'In Person',
      code: 'IP',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAppointmentModeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: mode,
    });
    await expect(updateAppointmentModeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: mode,
    });
    await expect(deleteAppointmentModeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: mode,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAppointmentMode.mockRejectedValue({
      code: '23505',
      constraint: 'appointment_mode_tenant_name_idx',
    });
    await expect(createAppointmentModeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment mode name 'In Person' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAppointmentMode.mockRejectedValue({
      code: '23505',
      constraint: 'appointment_mode_tenant_code_idx',
    });
    await expect(updateAppointmentModeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment mode code 'IP' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAppointmentMode.mockRejectedValue(error);
    await expect(createAppointmentModeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAppointmentModeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
