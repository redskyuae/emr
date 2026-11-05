import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateGetAyurvedaDiagnosisCodeById } from '../validator/get-ayurveda-diagnosis-code-by-id-validator';
import { validateGetAyurvedaDiagnosisCodes } from '../validator/get-ayurveda-diagnosis-codes-validator';
import { getAyurvedaDiagnosisCodeByIdQuery } from './get-ayurveda-diagnosis-code-by-id-query';
import { getAyurvedaDiagnosisCodesQuery } from './get-ayurveda-diagnosis-codes-query';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    getAyurvedaDiagnosisCodeById: vi.fn(),
    getAyurvedaDiagnosisCodes: vi.fn(),
  },
}));
vi.mock('../validator/get-ayurveda-diagnosis-code-by-id-validator', () => ({
  validateGetAyurvedaDiagnosisCodeById: vi.fn(),
}));
vi.mock('../validator/get-ayurveda-diagnosis-codes-validator', () => ({
  validateGetAyurvedaDiagnosisCodes: vi.fn(),
}));

const repo = ayurvedaDiagnosisCodeRepository as typeof ayurvedaDiagnosisCodeRepository & {
  getAyurvedaDiagnosisCodeById: Mock<
    typeof ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById
  >;
  getAyurvedaDiagnosisCodes: Mock<typeof ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodes>;
};
const validateById = validateGetAyurvedaDiagnosisCodeById as Mock<
  typeof validateGetAyurvedaDiagnosisCodeById
>;
const validateList = validateGetAyurvedaDiagnosisCodes as Mock<
  typeof validateGetAyurvedaDiagnosisCodes
>;
const ayurvedaDiagnosisCode = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'AYU-JVARA',
  title: 'Jvara (Fever)',
  category: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AyurvedaDiagnosisCode queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(ayurvedaDiagnosisCode);
    repo.getAyurvedaDiagnosisCodes.mockResolvedValue({ data: [ayurvedaDiagnosisCode], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAyurvedaDiagnosisCodeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAyurvedaDiagnosisCodeByIdQuery('1', 'tenant-1');
    expect(repo.getAyurvedaDiagnosisCodeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAyurvedaDiagnosisCodesQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'ayu-jvara',
      isActive: true,
    });
    expect(repo.getAyurvedaDiagnosisCodes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'ayu-jvara',
      isActive: true,
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAyurvedaDiagnosisCodesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [ayurvedaDiagnosisCode],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAyurvedaDiagnosisCodeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: ayurvedaDiagnosisCode,
    });
  });

  it('should return not-found status when Ayurveda diagnosis code is missing', async () => {
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);
    const result = await getAyurvedaDiagnosisCodeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
