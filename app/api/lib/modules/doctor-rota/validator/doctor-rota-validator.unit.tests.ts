import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import { validateCreateDoctorRota } from './create-doctor-rota-validator';
import { validateDeleteDoctorRota } from './delete-doctor-rota-validator';
import { validateGetDoctorRotaById } from './get-doctor-rota-by-id-validator';
import { validateGetDoctorRotas } from './get-doctor-rotas-validator';
import { validateUpdateDoctorRota } from './update-doctor-rota-validator';

vi.mock('../repository/doctor-rota-repository', () => ({
  doctorRotaRepository: {
    findActiveByName: vi.fn(),
    findActiveByTimeRange: vi.fn(),
    getDoctorRotaById: vi.fn(),
  },
}));

const repo = vi.mocked(doctorRotaRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Morning Rota',
  fromTime: '09:00',
  toTime: '13:00',
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('DoctorRota validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByTimeRange.mockResolvedValue(undefined);
    repo.getDoctorRotaById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateDoctorRota({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Doctor rota name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateDoctorRota({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByTimeRange).not.toHaveBeenCalled();
  });

  it('should return conflict when active doctor rota name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateDoctorRota(
      { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Doctor rota name 'Morning Rota' already exists."],
    });
  });

  it('should return conflict when active doctor rota time range already exists for tenant', async () => {
    repo.findActiveByTimeRange.mockResolvedValue(existing);
    const result = await validateCreateDoctorRota(
      { name: 'Clinic Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor rota already exists for the selected time range.'],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateDoctorRota(
      '7',
      { name: 'Afternoon Rota', fromTime: '13:00', toTime: '17:00' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Afternoon Rota', {
      excludeId: 7,
    });
    expect(repo.findActiveByTimeRange).toHaveBeenCalledWith('tenant-1', '13:00', '17:00', {
      excludeId: 7,
    });
  });

  it('should return update schema validation errors without repository access', async () => {
    const result = await validateUpdateDoctorRota(
      '1',
      { name: '', fromTime: '13:00', toTime: '12:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        'Doctor rota name cannot be empty',
        'Doctor rota to time must be after from time',
      ]),
    });
    expect(repo.getDoctorRotaById).not.toHaveBeenCalled();
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByTimeRange).not.toHaveBeenCalled();
  });

  it('should return conflict when update name already exists and preserve conflict status', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateUpdateDoctorRota(
      '1',
      { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Doctor rota name 'Morning Rota' already exists."],
    });
  });

  it('should return conflict when update time range already exists and preserve conflict status', async () => {
    repo.findActiveByTimeRange.mockResolvedValue(existing);
    const result = await validateUpdateDoctorRota(
      '1',
      { name: 'Clinic Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor rota already exists for the selected time range.'],
    });
  });

  it('should return not-found or validation error when requested id is invalid/missing according to existing validator behavior', async () => {
    expect(validateGetDoctorRotaById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Doctor rota abc is Invalid.'],
    });
    repo.getDoctorRotaById.mockResolvedValue(undefined);
    await expect(
      validateUpdateDoctorRota(
        '1',
        { name: 'Afternoon Rota', fromTime: '13:00', toTime: '17:00' },
        'tenant-1'
      )
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateDoctorRota(
        { name: ' Morning Rota ', fromTime: ' 09:00 ', toTime: ' 13:00 ' },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: true,
      data: { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
    });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateDoctorRota(
      { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteDoctorRota('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetDoctorRotas('  ')).toMatchObject({ success: false });
  });

  it('should return failure when delete id is invalid', () => {
    expect(validateDeleteDoctorRota('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Doctor rota abc is Invalid.'],
    });
  });
});
