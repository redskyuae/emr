import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import { validateCreateAppointmentStatus } from '../validator/create-appointment-status-validator';
import { validateDeleteAppointmentStatus } from '../validator/delete-appointment-status-validator';
import { validateUpdateAppointmentStatus } from '../validator/update-appointment-status-validator';
import { createAppointmentStatusCommand } from './create-appointment-status-command';
import { deleteAppointmentStatusCommand } from './delete-appointment-status-command';
import { updateAppointmentStatusCommand } from './update-appointment-status-command';

vi.mock('../repository/appointment-status-repository', () => ({
  appointmentStatusRepository: {
    createAppointmentStatus: vi.fn(),
    updateAppointmentStatus: vi.fn(),
    deleteAppointmentStatus: vi.fn(),
  },
}));
vi.mock('../validator/create-appointment-status-validator', () => ({
  validateCreateAppointmentStatus: vi.fn(),
}));
vi.mock('../validator/update-appointment-status-validator', () => ({
  validateUpdateAppointmentStatus: vi.fn(),
}));
vi.mock('../validator/delete-appointment-status-validator', () => ({
  validateDeleteAppointmentStatus: vi.fn(),
}));

const repo = appointmentStatusRepository as typeof appointmentStatusRepository & {
  createAppointmentStatus: Mock<typeof appointmentStatusRepository.createAppointmentStatus>;
  updateAppointmentStatus: Mock<typeof appointmentStatusRepository.updateAppointmentStatus>;
  deleteAppointmentStatus: Mock<typeof appointmentStatusRepository.deleteAppointmentStatus>;
};
const validateCreate = validateCreateAppointmentStatus as Mock<
  typeof validateCreateAppointmentStatus
>;
const validateUpdate = validateUpdateAppointmentStatus as Mock<
  typeof validateUpdateAppointmentStatus
>;
const validateDelete = validateDeleteAppointmentStatus as Mock<
  typeof validateDeleteAppointmentStatus
>;
const status = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Scheduled',
  code: 'SCH',
  category: 'SCHEDULED' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentStatus commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Scheduled', code: 'SCH', category: 'SCHEDULED', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: {
          name: 'Scheduled',
          code: 'SCH',
          category: 'SCHEDULED',
          description: undefined,
        },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAppointmentStatus.mockResolvedValue(status);
    repo.updateAppointmentStatus.mockResolvedValue(status);
    repo.deleteAppointmentStatus.mockResolvedValue(status);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAppointmentStatusCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAppointmentStatus).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAppointmentStatusCommand({}, 'tenant-1');
    expect(repo.createAppointmentStatus).toHaveBeenCalledWith({
      name: 'Scheduled',
      code: 'SCH',
      category: 'SCHEDULED',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAppointmentStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
    await expect(updateAppointmentStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: status,
    });
    await expect(deleteAppointmentStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAppointmentStatus.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_status_tenant_name_idx' },
    });
    await expect(createAppointmentStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment status name 'Scheduled' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAppointmentStatus.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_status_tenant_code_idx' },
    });
    await expect(updateAppointmentStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment status code 'SCH' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAppointmentStatus.mockRejectedValue(error);
    await expect(createAppointmentStatusCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAppointmentStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
