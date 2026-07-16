import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import { validateCreateAppointmentStatus } from './create-appointment-status-validator';
import { validateDeleteAppointmentStatus } from './delete-appointment-status-validator';
import { validateGetAppointmentStatusById } from './get-appointment-status-by-id-validator';
import { validateGetAppointmentStatuses } from './get-appointment-statuses-validator';
import { validateUpdateAppointmentStatus } from './update-appointment-status-validator';

vi.mock('../repository/appointment-status-repository', () => ({
  appointmentStatusRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAppointmentStatusById: vi.fn(),
  },
}));

const repo = appointmentStatusRepository as typeof appointmentStatusRepository & {
  findActiveByName: Mock<typeof appointmentStatusRepository.findActiveByName>;
  findActiveByCode: Mock<typeof appointmentStatusRepository.findActiveByCode>;
  getAppointmentStatusById: Mock<typeof appointmentStatusRepository.getAppointmentStatusById>;
};
const existing = {
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

describe('AppointmentStatus validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAppointmentStatusById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAppointmentStatus({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment status name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAppointmentStatus({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active appointment status name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAppointmentStatus(
      { name: 'Scheduled', code: 'SCH', category: 'SCHEDULED' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment status name 'Scheduled' already exists."],
    });
  });

  it('should return conflict when active appointment status code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentStatus(
      { name: 'Scheduled', code: 'SCH', category: 'SCHEDULED' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment status code 'SCH' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentStatus(
      { name: 'Scheduled', code: 'SCH', category: 'SCHEDULED' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Appointment status name 'Scheduled' already exists.",
        "Appointment status code 'SCH' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAppointmentStatus(
      '7',
      { name: 'Completed', code: 'cmp', category: 'COMPLETED' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Completed', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'CMP', { excludeId: 7 });
  });

  it('should return not-found or validation error when requested id is invalid/missing according to existing validator behavior', async () => {
    expect(validateGetAppointmentStatusById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment status abc is Invalid.'],
    });
    repo.getAppointmentStatusById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAppointmentStatus(
        '1',
        { name: 'Completed', code: 'CMP', category: 'COMPLETED' },
        'tenant-1'
      )
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAppointmentStatus(
        { name: ' Completed ', code: 'cmp', category: 'COMPLETED' },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: true,
      data: { name: 'Completed', code: 'CMP', category: 'COMPLETED' },
    });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentStatus(
      { name: 'Completed', code: 'CMP', category: 'COMPLETED' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAppointmentStatus('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAppointmentStatuses('  ')).toMatchObject({ success: false });
  });
});
