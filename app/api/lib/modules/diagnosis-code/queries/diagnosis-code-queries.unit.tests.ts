import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import { validateGetDiagnosisCodeById } from '../validator/get-diagnosis-code-by-id-validator';
import { validateGetDiagnosisCodes } from '../validator/get-diagnosis-codes-validator';
import { getDiagnosisCodeByIdQuery } from './get-diagnosis-code-by-id-query';
import { getDiagnosisCodesQuery } from './get-diagnosis-codes-query';

vi.mock('../repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: {
    getDiagnosisCodeById: vi.fn(),
    getDiagnosisCodes: vi.fn(),
  },
}));
vi.mock('../validator/get-diagnosis-code-by-id-validator', () => ({
  validateGetDiagnosisCodeById: vi.fn(),
}));
vi.mock('../validator/get-diagnosis-codes-validator', () => ({
  validateGetDiagnosisCodes: vi.fn(),
}));

const repo = diagnosisCodeRepository as typeof diagnosisCodeRepository & {
  getDiagnosisCodeById: Mock<typeof diagnosisCodeRepository.getDiagnosisCodeById>;
  getDiagnosisCodes: Mock<typeof diagnosisCodeRepository.getDiagnosisCodes>;
};
const validateById = validateGetDiagnosisCodeById as Mock<typeof validateGetDiagnosisCodeById>;
const validateList = validateGetDiagnosisCodes as Mock<typeof validateGetDiagnosisCodes>;
const diagnosisCode = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'I10',
  title: 'Essential hypertension',
  category: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('DiagnosisCode queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getDiagnosisCodeById.mockResolvedValue(diagnosisCode);
    repo.getDiagnosisCodes.mockResolvedValue({ data: [diagnosisCode], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getDiagnosisCodeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getDiagnosisCodeByIdQuery('1', 'tenant-1');
    expect(repo.getDiagnosisCodeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getDiagnosisCodesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'i10' });
    expect(repo.getDiagnosisCodes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'i10',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getDiagnosisCodesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [diagnosisCode],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getDiagnosisCodeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: diagnosisCode,
    });
  });

  it('should return not-found status when diagnosis code is missing', async () => {
    repo.getDiagnosisCodeById.mockResolvedValue(undefined);
    const result = await getDiagnosisCodeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
