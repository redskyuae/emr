import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import { validateCreateAppointmentMode } from './create-appointment-mode-validator';
import { validateDeleteAppointmentMode } from './delete-appointment-mode-validator';
import { validateGetAppointmentModeById } from './get-appointment-mode-by-id-validator';
import { validateGetAppointmentModes } from './get-appointment-modes-validator';
import { validateUpdateAppointmentMode } from './update-appointment-mode-validator';

vi.mock('../repository/appointment-mode-repository', () => ({
  appointmentModeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAppointmentModeById: vi.fn(),
  },
}));

const repo = vi.mocked(appointmentModeRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'In Person',
  code: 'IP',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentMode validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAppointmentModeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAppointmentMode({}, 'tenant-1');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Appointment mode name is required');
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAppointmentMode({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active appointment mode name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAppointmentMode(
      { name: 'In Person', code: 'IP' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment mode name 'In Person' already exists."],
    });
  });

  it('should return conflict when active appointment mode code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentMode(
      { name: 'In Person', code: 'IP' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment mode code 'IP' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentMode(
      { name: 'In Person', code: 'IP' },
      'tenant-1'
    );
    expect(result.errors).toEqual([
      "Appointment mode name 'In Person' already exists.",
      "Appointment mode code 'IP' already exists.",
    ]);
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAppointmentMode('7', { name: 'Video', code: 'vid' }, 'tenant-1');
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Video', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'VID', { excludeId: 7 });
  });

  it('should return not-found or validation error when requested id is invalid/missing according to existing validator behavior', async () => {
    expect(validateGetAppointmentModeById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment mode abc is Invalid.'],
    });
    repo.getAppointmentModeById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAppointmentMode('1', { name: 'Video', code: 'VID' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAppointmentMode({ name: ' Video ', code: 'vid' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Video', code: 'VID' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentMode({ name: 'Video', code: 'VID' }, 'tenant-1');
    expect(result.status).toBe(StatusCodes.CONFLICT);
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAppointmentMode('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAppointmentModes('  ')).toMatchObject({ success: false });
  });
});
