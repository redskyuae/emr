import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { validateCreateAyurvedaDiagnosisCode } from './create-ayurveda-diagnosis-code-validator';
import { validateDeleteAyurvedaDiagnosisCode } from './delete-ayurveda-diagnosis-code-validator';
import { validateAyurvedaDiagnosisCodeExists } from './ayurveda-diagnosis-code-exists-validator';
import { validateGetAyurvedaDiagnosisCodeById } from './get-ayurveda-diagnosis-code-by-id-validator';
import { validateGetAyurvedaDiagnosisCodes } from './get-ayurveda-diagnosis-codes-validator';
import { validateUpdateAyurvedaDiagnosisCode } from './update-ayurveda-diagnosis-code-validator';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    findActiveByCode: vi.fn(),
    getAyurvedaDiagnosisCodeById: vi.fn(),
  },
}));

const repo = ayurvedaDiagnosisCodeRepository as typeof ayurvedaDiagnosisCodeRepository & {
  findActiveByCode: Mock<typeof ayurvedaDiagnosisCodeRepository.findActiveByCode>;
  getAyurvedaDiagnosisCodeById: Mock<
    typeof ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById
  >;
};
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  code: 'AYU-JVARA',
  title: 'Jvara (Fever)',
  category: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AyurvedaDiagnosisCode validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAyurvedaDiagnosisCode({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Ayurveda diagnosis code is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAyurvedaDiagnosisCode({}, 'tenant-1');
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active Ayurveda diagnosis code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAyurvedaDiagnosisCode(
      { code: 'AYU-JVARA', title: 'Jvara (Fever)' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Ayurveda diagnosis code 'AYU-JVARA' already exists."],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAyurvedaDiagnosisCode('7', { code: 'ayu-kasa', title: 'Kasa' }, 'tenant-1');
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'AYU-KASA', { excludeId: 7 });
  });

  it('should return invalid id message and not-found according to validator behavior', async () => {
    expect(validateGetAyurvedaDiagnosisCodeById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Ayurveda diagnosis code abc is Invalid.'],
    });
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAyurvedaDiagnosisCode('1', { code: 'AYU-KASA', title: 'Kasa' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAyurvedaDiagnosisCode(
        { code: ' ayu-jvara ', title: ' Jvara (Fever) ' },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: true,
      data: { code: 'AYU-JVARA', title: 'Jvara (Fever)' },
    });
  });

  it('should return the existing Ayurveda diagnosis code when it exists', async () => {
    await expect(validateAyurvedaDiagnosisCodeExists('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: existing,
    });
    expect(repo.getAyurvedaDiagnosisCodeById).toHaveBeenCalledWith(1, 'tenant-1');
  });

  it('should reject an invalid id without reading the repository', async () => {
    await expect(validateAyurvedaDiagnosisCodeExists('abc', 'tenant-1')).resolves.toMatchObject({
      success: false,
      errors: ['Ayurveda diagnosis code abc is Invalid.'],
    });
    expect(repo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
  });

  it('should return not-found when the Ayurveda diagnosis code does not exist', async () => {
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);

    await expect(validateAyurvedaDiagnosisCodeExists('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Ayurveda diagnosis code not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAyurvedaDiagnosisCode('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAyurvedaDiagnosisCodes('  ')).toMatchObject({ success: false });
  });
});
