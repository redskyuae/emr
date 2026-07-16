import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';
import { validateCreateDiagnosisCode } from './create-diagnosis-code-validator';
import { validateDeleteDiagnosisCode } from './delete-diagnosis-code-validator';
import { validateGetDiagnosisCodeById } from './get-diagnosis-code-by-id-validator';
import { validateGetDiagnosisCodes } from './get-diagnosis-codes-validator';
import { validateUpdateDiagnosisCode } from './update-diagnosis-code-validator';

vi.mock('../repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: {
    findActiveByCode: vi.fn(),
    getDiagnosisCodeById: vi.fn(),
  },
}));

const repo = diagnosisCodeRepository as typeof diagnosisCodeRepository & {
  findActiveByCode: Mock<typeof diagnosisCodeRepository.findActiveByCode>;
  getDiagnosisCodeById: Mock<typeof diagnosisCodeRepository.getDiagnosisCodeById>;
};
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'I10',
  title: 'Essential hypertension',
  category: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('DiagnosisCode validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getDiagnosisCodeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateDiagnosisCode({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Diagnosis code is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateDiagnosisCode({}, 'tenant-1');
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active diagnosis code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateDiagnosisCode(
      { code: 'I10', title: 'Essential hypertension' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Diagnosis code 'I10' already exists."],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateDiagnosisCode('7', { code: 'e11', title: 'Diabetes' }, 'tenant-1');
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'E11', { excludeId: 7 });
  });

  it('should return invalid id message and not-found according to validator behavior', async () => {
    expect(validateGetDiagnosisCodeById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Diagnosis code abc is Invalid.'],
    });
    repo.getDiagnosisCodeById.mockResolvedValue(undefined);
    await expect(
      validateUpdateDiagnosisCode('1', { code: 'E11', title: 'Diabetes' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateDiagnosisCode({ code: ' i10 ', title: ' Essential hypertension ' }, 'tenant-1')
    ).resolves.toEqual({
      success: true,
      data: { code: 'I10', title: 'Essential hypertension' },
    });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteDiagnosisCode('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetDiagnosisCodes('  ')).toMatchObject({ success: false });
  });
});
