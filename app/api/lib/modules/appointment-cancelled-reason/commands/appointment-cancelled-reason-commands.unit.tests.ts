import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import { validateCreateAppointmentCancelledReason } from '../validator/create-appointment-cancelled-reason-validator';
import { validateDeleteAppointmentCancelledReason } from '../validator/delete-appointment-cancelled-reason-validator';
import { validateUpdateAppointmentCancelledReason } from '../validator/update-appointment-cancelled-reason-validator';
import { createAppointmentCancelledReasonCommand } from './create-appointment-cancelled-reason-command';
import { deleteAppointmentCancelledReasonCommand } from './delete-appointment-cancelled-reason-command';
import { updateAppointmentCancelledReasonCommand } from './update-appointment-cancelled-reason-command';

vi.mock('../repository/appointment-cancelled-reason-repository', () => ({
  appointmentCancelledReasonRepository: {
    createAppointmentCancelledReason: vi.fn(),
    updateAppointmentCancelledReason: vi.fn(),
    deleteAppointmentCancelledReason: vi.fn(),
  },
}));
vi.mock('../validator/create-appointment-cancelled-reason-validator', () => ({
  validateCreateAppointmentCancelledReason: vi.fn(),
}));
vi.mock('../validator/update-appointment-cancelled-reason-validator', () => ({
  validateUpdateAppointmentCancelledReason: vi.fn(),
}));
vi.mock('../validator/delete-appointment-cancelled-reason-validator', () => ({
  validateDeleteAppointmentCancelledReason: vi.fn(),
}));

const repo = vi.mocked(appointmentCancelledReasonRepository);
const validateCreate = vi.mocked(validateCreateAppointmentCancelledReason);
const validateUpdate = vi.mocked(validateUpdateAppointmentCancelledReason);
const validateDelete = vi.mocked(validateDeleteAppointmentCancelledReason);
const reason = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Cancelled',
  code: 'CX',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentCancelledReason commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Cancelled', code: 'CX', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { name: 'Cancelled', code: 'CX', description: undefined } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAppointmentCancelledReason.mockResolvedValue(reason);
    repo.updateAppointmentCancelledReason.mockResolvedValue(reason);
    repo.deleteAppointmentCancelledReason.mockResolvedValue(reason);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAppointmentCancelledReasonCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAppointmentCancelledReason).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAppointmentCancelledReasonCommand({}, 'tenant-1');
    expect(repo.createAppointmentCancelledReason).toHaveBeenCalledWith({
      name: 'Cancelled',
      code: 'CX',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAppointmentCancelledReasonCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: reason,
    });
    await expect(updateAppointmentCancelledReasonCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: reason,
    });
    await expect(deleteAppointmentCancelledReasonCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAppointmentCancelledReason.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_cancelled_reason_tenant_name_idx' },
    });
    await expect(createAppointmentCancelledReasonCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment cancelled reason name 'Cancelled' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAppointmentCancelledReason.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_cancelled_reason_tenant_code_idx' },
    });
    await expect(updateAppointmentCancelledReasonCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment cancelled reason code 'CX' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAppointmentCancelledReason.mockRejectedValue(error);
    await expect(createAppointmentCancelledReasonCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAppointmentCancelledReasonCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
