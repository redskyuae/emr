import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import { validateCreateDoctorRota } from '../validator/create-doctor-rota-validator';
import { validateDeleteDoctorRota } from '../validator/delete-doctor-rota-validator';
import { validateUpdateDoctorRota } from '../validator/update-doctor-rota-validator';
import { createDoctorRotaCommand } from './create-doctor-rota-command';
import { deleteDoctorRotaCommand } from './delete-doctor-rota-command';
import { updateDoctorRotaCommand } from './update-doctor-rota-command';

vi.mock('../repository/doctor-rota-repository', () => ({
  doctorRotaRepository: {
    createDoctorRota: vi.fn(),
    updateDoctorRota: vi.fn(),
    deleteDoctorRota: vi.fn(),
  },
}));
vi.mock('../validator/create-doctor-rota-validator', () => ({
  validateCreateDoctorRota: vi.fn(),
}));
vi.mock('../validator/update-doctor-rota-validator', () => ({
  validateUpdateDoctorRota: vi.fn(),
}));
vi.mock('../validator/delete-doctor-rota-validator', () => ({
  validateDeleteDoctorRota: vi.fn(),
}));

const repo = vi.mocked(doctorRotaRepository);
const validateCreate = vi.mocked(validateCreateDoctorRota);
const validateUpdate = vi.mocked(validateUpdateDoctorRota);
const validateDelete = vi.mocked(validateDeleteDoctorRota);
const rota = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Morning Rota',
  fromTime: '09:00',
  toTime: '13:00',
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('DoctorRota commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createDoctorRota.mockResolvedValue(rota);
    repo.updateDoctorRota.mockResolvedValue(rota);
    repo.deleteDoctorRota.mockResolvedValue(rota);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createDoctorRotaCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createDoctorRota).not.toHaveBeenCalled();
  });

  it('should return structured create validation failure when uniqueness validation fails', async () => {
    validateCreate.mockResolvedValue({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      errors: ['Doctor rota uniqueness validation failed.'],
    });
    const result = await createDoctorRotaCommand(
      { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
      'tenant-1'
    );
    expect(result).toEqual({
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      errors: ['Doctor rota uniqueness validation failed.'],
    });
    expect(repo.createDoctorRota).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createDoctorRotaCommand({}, 'tenant-1');
    expect(repo.createDoctorRota).toHaveBeenCalledWith({
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '13:00',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createDoctorRotaCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: rota,
    });
    await expect(updateDoctorRotaCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: rota,
    });
    await expect(deleteDoctorRotaCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: rota,
    });
  });

  it('should return delete validation failure and not call repository when validator fails', async () => {
    validateDelete.mockReturnValue({ success: false, errors: ['Invalid'] });
    const result = await deleteDoctorRotaCommand('bad', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'] });
    expect(repo.deleteDoctorRota).not.toHaveBeenCalled();
  });

  it('should return not-found when update repository does not find doctor rota', async () => {
    repo.updateDoctorRota.mockResolvedValue(undefined);
    await expect(updateDoctorRotaCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Doctor rota not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createDoctorRota.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_rota_tenant_name_idx' },
    });
    await expect(createDoctorRotaCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Doctor rota name 'Morning Rota' already exists."],
    });
  });

  it('should map update Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.updateDoctorRota.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_rota_tenant_name_idx' },
    });
    await expect(updateDoctorRotaCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Doctor rota name 'Morning Rota' already exists."],
    });
  });

  it('should map Postgres unique constraint 23505 for time range index to conflict error', async () => {
    repo.createDoctorRota.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_rota_tenant_time_range_idx' },
    });
    await expect(
      createDoctorRotaCommand(
        { name: 'Morning Rota', fromTime: '09:00', toTime: '13:00' },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor rota already exists for the selected time range.'],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createDoctorRota.mockRejectedValue(error);
    await expect(createDoctorRotaCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateDoctorRotaCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.updateDoctorRota).not.toHaveBeenCalled();
  });
});
