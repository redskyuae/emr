import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppointmentReasonCommand } from './create-appointment-reason-command';
import { deleteAppointmentReasonCommand } from './delete-appointment-reason-command';
import { updateAppointmentReasonCommand } from './update-appointment-reason-command';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';

// Mock repository at module level - validators call this
vi.mock('../repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: {
    createAppointmentReason: vi.fn(),
    updateAppointmentReason: vi.fn(),
    deleteAppointmentReason: vi.fn(),
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAppointmentReasonById: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(appointmentReasonRepository);

const reason = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentReason commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default successful responses for uniqueness checks
    mockedRepo.findActiveByName.mockResolvedValue(undefined);
    mockedRepo.findActiveByCode.mockResolvedValue(undefined);
    mockedRepo.getAppointmentReasonById.mockResolvedValue(reason);
    mockedRepo.createAppointmentReason.mockResolvedValue(reason);
    mockedRepo.updateAppointmentReason.mockResolvedValue(reason);
    mockedRepo.deleteAppointmentReason.mockResolvedValue(reason);
  });

  it('should return validation failure when schema is invalid', async () => {
    const result = await createAppointmentReasonCommand({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment reason name is required']),
    });
  });

  it('should return conflict when name already exists', async () => {
    mockedRepo.findActiveByName.mockResolvedValue(reason);
    const result = await createAppointmentReasonCommand(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason name 'Checkup' already exists."],
    });
  });

  it('should return conflict when code already exists', async () => {
    mockedRepo.findActiveByCode.mockResolvedValue(reason);
    const result = await createAppointmentReasonCommand(
      { name: 'Checkup', code: 'CHK' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason code 'CHK' already exists."],
    });
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAppointmentReasonCommand({ name: 'Checkup', code: 'CHK' }, 'tenant-1');
    expect(mockedRepo.createAppointmentReason).toHaveBeenCalledWith({
      name: 'Checkup',
      code: 'CHK',
      tenantId: 'tenant-1',
    });
  });

  it('should return created data on repository success', async () => {
    await expect(
      createAppointmentReasonCommand({ name: 'Checkup', code: 'CHK' }, 'tenant-1')
    ).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    const error = { cause: { code: '23505', constraint: 'appointment_reason_tenant_name_idx' } };
    mockedRepo.createAppointmentReason.mockRejectedValue(error);
    await expect(
      createAppointmentReasonCommand({ name: 'Checkup', code: 'CHK' }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason name 'Checkup' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    const error = { cause: { code: '23505', constraint: 'appointment_reason_tenant_code_idx' } };
    mockedRepo.updateAppointmentReason.mockRejectedValue(error);
    await expect(
      updateAppointmentReasonCommand('1', 'tenant-1', { name: 'Checkup', code: 'CHK' })
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment reason code 'CHK' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    mockedRepo.createAppointmentReason.mockRejectedValue(error);
    await expect(
      createAppointmentReasonCommand({ name: 'Checkup', code: 'CHK' }, 'tenant-1')
    ).rejects.toThrow(error);
  });

  it('should return updated data on repository success', async () => {
    await expect(
      updateAppointmentReasonCommand('1', 'tenant-1', { name: 'Checkup', code: 'CHK' })
    ).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should return deleted data on repository success', async () => {
    await expect(deleteAppointmentReasonCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should return not found when deleting non-existent entity', async () => {
    mockedRepo.deleteAppointmentReason.mockResolvedValue(undefined);
    await expect(deleteAppointmentReasonCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment reason not found'],
    });
  });

  it('should return not found when updating non-existent entity', async () => {
    mockedRepo.getAppointmentReasonById.mockResolvedValue(undefined);
    await expect(
      updateAppointmentReasonCommand('1', 'tenant-1', { name: 'Checkup', code: 'CHK' })
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment reason not found'],
    });
  });
});
