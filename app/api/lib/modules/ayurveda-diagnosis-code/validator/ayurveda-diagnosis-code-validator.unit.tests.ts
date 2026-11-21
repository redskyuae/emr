import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { ayurvedaDiagnosisCodeRepository } from '../repository/ayurveda-diagnosis-code-repository';
import { getAyurvedaDiagnosisCodeUniqueConstraintErrors } from './ayurveda-diagnosis-code-reference-validator';
import { validateAyurvedaDiagnosisCodeId } from './ayurveda-diagnosis-code-id-validator';
import { validateCreateAyurvedaDiagnosisCode } from './create-ayurveda-diagnosis-code-validator';
import { validateGetAyurvedaDiagnosisCodes } from './get-ayurveda-diagnosis-codes-validator';
import { validateUpdateAyurvedaDiagnosisCode } from './update-ayurveda-diagnosis-code-validator';

vi.mock('../repository/ayurveda-diagnosis-code-repository', () => ({
  ayurvedaDiagnosisCodeRepository: {
    findActiveByCode: vi.fn(),
    getAyurvedaDiagnosisCodeById: vi.fn(),
  },
}));
vi.mock('../../diagnosis-code/repository/diagnosis-code-repository', () => ({
  diagnosisCodeRepository: { getDiagnosisCodeById: vi.fn() },
}));

const repo = vi.mocked(ayurvedaDiagnosisCodeRepository);
const diagnosisCodeRepo = vi.mocked(diagnosisCodeRepository);

const icdCode = {
  id: 5,
  code: 'M06.9',
  title: 'Rheumatoid arthritis, unspecified',
  tenantId: 'tenant-1',
  category: 'Musculoskeletal',
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const existing = {
  id: 1,
  code: 'AYU-AMV',
  name: 'Amavata',
  tenantId: 'tenant-1',
  category: null,
  englishName: 'Rheumatoid arthritis',
  createdOn: new Date(),
  modifiedOn: new Date(),
  icdDiagnosisCode: { id: 5, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
};
const payload = { code: 'ayu-amv', name: 'Amavata', icdDiagnosisCodeId: 5 };

describe('AyurvedaDiagnosisCode validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(existing);
    diagnosisCodeRepo.getDiagnosisCodeById.mockResolvedValue(icdCode);
  });

  describe('validateCreateAyurvedaDiagnosisCode', () => {
    it('should not call the repositories when schema parsing fails', async () => {
      const result = await validateCreateAyurvedaDiagnosisCode({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
      expect(diagnosisCodeRepo.getDiagnosisCodeById).not.toHaveBeenCalled();
    });

    it('should return the parsed payload when the code is unique and the mapping exists', async () => {
      await expect(validateCreateAyurvedaDiagnosisCode(payload, 'tenant-1')).resolves.toEqual({
        success: true,
        data: {
          code: 'AYU-AMV',
          name: 'Amavata',
          category: undefined,
          englishName: undefined,
          icdDiagnosisCodeId: 5,
        },
      });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'AYU-AMV', {
        excludeId: undefined,
      });
      expect(diagnosisCodeRepo.getDiagnosisCodeById).toHaveBeenCalledWith(5, 'tenant-1');
    });

    it('should return a conflict with the uppercased code when it already exists', async () => {
      repo.findActiveByCode.mockResolvedValue({ id: 2 });

      await expect(validateCreateAyurvedaDiagnosisCode(payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code AYU-AMV already exists.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return a conflict when the mapped Diagnosis Code does not exist', async () => {
      diagnosisCodeRepo.getDiagnosisCodeById.mockResolvedValue(undefined);

      await expect(validateCreateAyurvedaDiagnosisCode(payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Diagnosis code 5 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should report a duplicate code and a missing mapping together', async () => {
      repo.findActiveByCode.mockResolvedValue({ id: 2 });
      diagnosisCodeRepo.getDiagnosisCodeById.mockResolvedValue(undefined);

      const result = await validateCreateAyurvedaDiagnosisCode(payload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Ayurveda diagnosis code AYU-AMV already exists.', 'Diagnosis code 5 is Invalid.'],
      });
    });

    it('should not look up a Diagnosis Code when the code is unmapped', async () => {
      await validateCreateAyurvedaDiagnosisCode({ code: 'AYU-AMV', name: 'Amavata' }, 'tenant-1');

      expect(diagnosisCodeRepo.getDiagnosisCodeById).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdateAyurvedaDiagnosisCode', () => {
    it('should return an invalid id error without repository calls', async () => {
      const result = await validateUpdateAyurvedaDiagnosisCode('abc', payload, 'tenant-1');

      expect(result).toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code abc is Invalid.'],
      });
      expect(repo.getAyurvedaDiagnosisCodeById).not.toHaveBeenCalled();
    });

    it('should return not found when the Ayurveda Diagnosis Code does not exist', async () => {
      repo.getAyurvedaDiagnosisCodeById.mockResolvedValue(undefined);

      await expect(validateUpdateAyurvedaDiagnosisCode('1', payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code not found'],
        status: StatusCodes.NOT_FOUND,
      });
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should pass excludeId to the uniqueness check and return the id and payload', async () => {
      const result = await validateUpdateAyurvedaDiagnosisCode('7', payload, 'tenant-1');

      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'AYU-AMV', { excludeId: 7 });
      expect(result).toMatchObject({
        success: true,
        data: { id: 7, payload: { code: 'AYU-AMV', icdDiagnosisCodeId: 5 } },
      });
    });

    it('should propagate the conflict status from the reference checks', async () => {
      diagnosisCodeRepo.getDiagnosisCodeById.mockResolvedValue(undefined);

      const result = await validateUpdateAyurvedaDiagnosisCode('7', payload, 'tenant-1');

      expect(result).toMatchObject({ success: false, status: StatusCodes.CONFLICT });
    });
  });

  describe('validateAyurvedaDiagnosisCodeId', () => {
    it('should return the exact invalid id message', () => {
      expect(validateAyurvedaDiagnosisCodeId('x', 'tenant-1')).toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code x is Invalid.'],
      });
    });

    it('should return the parsed id and tenant id', () => {
      expect(validateAyurvedaDiagnosisCodeId('4', 'tenant-1')).toEqual({
        success: true,
        data: { id: 4, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAyurvedaDiagnosisCodes', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetAyurvedaDiagnosisCodes('  ')).toMatchObject({ success: false });
      expect(validateGetAyurvedaDiagnosisCodes('tenant-1')).toEqual({
        success: true,
        data: 'tenant-1',
      });
    });
  });

  describe('getAyurvedaDiagnosisCodeUniqueConstraintErrors', () => {
    it('should map the wrapped code unique violation to the duplicate message', () => {
      expect(
        getAyurvedaDiagnosisCodeUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'ayurveda_diagnosis_code_tenant_code_idx' } },
          { code: 'AYU-AMV' }
        )
      ).toEqual(['Ayurveda diagnosis code AYU-AMV already exists.']);
    });

    it('should ignore other database errors', () => {
      expect(
        getAyurvedaDiagnosisCodeUniqueConstraintErrors({ cause: { code: '23503' } }, { code: 'X' })
      ).toEqual([]);
    });
  });
});
