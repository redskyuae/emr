import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateAyurvedaDiagnosisCodeId } from '../validator/ayurveda-diagnosis-code-id-validator';
import { getAyurvedaDiagnosisCodeByIdQuery } from './get-ayurveda-diagnosis-code-by-id-query';
import { getAyurvedaDiagnosisCodesQuery } from './get-ayurveda-diagnosis-codes-query';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    getAyurvedaDiagnosisCodes: vi.fn(),
    getAyurvedaDiagnosisCodeById: vi.fn(),
  },
}));
vi.mock('../validator/ayurveda-diagnosis-code-id-validator', () => ({
  validateAyurvedaDiagnosisCodeId: vi.fn(),
}));

const repo = vi.mocked(ayurvedaDiagnosisCodeRepository);
const validateId = vi.mocked(validateAyurvedaDiagnosisCodeId);
const ayurvedaDiagnosisCode = {
  id: 1,
  code: 'AYU-AMV',
  name: 'Amavata',
  tenantId: 'tenant-1',
  category: null,
  englishName: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  icdDiagnosisCode: null,
};

describe('AyurvedaDiagnosisCode queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateId.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.getAyurvedaDiagnosisCodes.mockResolvedValue({ data: [ayurvedaDiagnosisCode], total: 1 });
  });

  it('should not call the repository when the tenant id is invalid', async () => {
    const result = await getAyurvedaDiagnosisCodesQuery({ tenantId: '  ' });

    expect(result.success).toBe(false);
    expect(repo.getAyurvedaDiagnosisCodes).not.toHaveBeenCalled();
  });

  it('should pass paging and search params through and return the list result', async () => {
    await expect(
      getAyurvedaDiagnosisCodesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'ama' })
    ).resolves.toEqual({ success: true, data: [ayurvedaDiagnosisCode], total: 1 });
    expect(repo.getAyurvedaDiagnosisCodes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'ama',
    });
  });

  it('should short-circuit get-by-id when validation fails', async () => {
    validateId.mockReturnValue({
      success: false,
      errors: ['Ayurveda diagnosis code x is Invalid.'],
    });

    await expect(getAyurvedaDiagnosisCodeByIdQuery('x', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code x is Invalid.'],
    });
    expect(repo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should return the row by id and Tenant', async () => {
    await expect(getAyurvedaDiagnosisCodeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
    expect(repo.getAyurvedaDiagnosisCodeById).toHaveBeenCalledWith(1, 'tenant-1');
  });

  it('should return not found when the row is missing', async () => {
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);

    await expect(getAyurvedaDiagnosisCodeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });
});
