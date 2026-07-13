import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import { validateGetDoctorRotaById } from '../validator/get-doctor-rota-by-id-validator';
import { validateGetDoctorRotas } from '../validator/get-doctor-rotas-validator';
import { getDoctorRotaByIdQuery } from './get-doctor-rota-by-id-query';
import { getDoctorRotasQuery } from './get-doctor-rotas-query';

vi.mock('../repository/doctor-rota-repository', () => ({
  doctorRotaRepository: { getDoctorRotaById: vi.fn(), getDoctorRotas: vi.fn() },
}));
vi.mock('../validator/get-doctor-rota-by-id-validator', () => ({
  validateGetDoctorRotaById: vi.fn(),
}));
vi.mock('../validator/get-doctor-rotas-validator', () => ({
  validateGetDoctorRotas: vi.fn(),
}));

const repo = vi.mocked(doctorRotaRepository);
const validateById = vi.mocked(validateGetDoctorRotaById);
const validateList = vi.mocked(validateGetDoctorRotas);
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

describe('DoctorRota queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getDoctorRotaById.mockResolvedValue(rota);
    repo.getDoctorRotas.mockResolvedValue({ data: [rota], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getDoctorRotaByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getDoctorRotaById).not.toHaveBeenCalled();
  });

  it('should return validation failure and not call repository when list tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Invalid tenant'] });
    await expect(getDoctorRotasQuery({ tenantId: ' ' })).resolves.toEqual({
      success: false,
      errors: ['Invalid tenant'],
    });
    expect(repo.getDoctorRotas).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getDoctorRotaByIdQuery('1', 'tenant-1');
    expect(repo.getDoctorRotaById).toHaveBeenCalledWith(1, 'tenant-1');
    await getDoctorRotasQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'morning' });
    expect(repo.getDoctorRotas).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'morning',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getDoctorRotasQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [rota],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getDoctorRotaByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: rota,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getDoctorRotaById.mockResolvedValue(undefined);
    const result = await getDoctorRotaByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
