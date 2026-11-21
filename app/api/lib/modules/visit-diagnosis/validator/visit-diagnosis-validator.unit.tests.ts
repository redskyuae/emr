import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../../visit/repository/visit-repository';
import type { Visit } from '../../visit/schemas/visit-schema';
import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../schemas/visit-diagnosis-schema';
import { validateAmendVisitDiagnoses } from './amend-visit-diagnoses-validator';
import { validateListVisitDiagnoses } from './list-visit-diagnoses-validator';
import { validateSaveVisitDiagnoses } from './save-visit-diagnoses-validator';
import { getVisitDiagnosisConstraintErrors } from './visit-diagnoses-payload-validator';

vi.mock('../../visit/repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('../repository/visit-diagnosis-repository', () => ({
  visitDiagnosisRepository: {
    listByVisit: vi.fn(),
    getDiagnosisCodeReferences: vi.fn(),
    getAyurvedaDiagnosisCodeReferences: vi.fn(),
  },
}));

const visitRepo = vi.mocked(visitRepository);
const repo = vi.mocked(visitDiagnosisRepository);

const visitWith = (status: Visit['status']) =>
  ({ id: 9, visitNumber: 'VST-1001', status }) as Visit;

const recordedIcd: VisitDiagnosis = {
  id: 1,
  visitId: 9,
  codeSystem: 'ICD10CM',
  diagnosisType: 'PRINCIPAL',
  sortOrder: 1,
  notes: null,
  code: 'M06.9',
  title: 'Rheumatoid arthritis, unspecified',
  englishName: null,
  diagnosisCodeId: 5,
  ayurvedaDiagnosisCodeId: null,
  icdMapping: null,
};

const payload = {
  diagnoses: [
    { codeSystem: 'ICD10CM', diagnosisCodeId: 5, diagnosisType: 'PRINCIPAL' },
    { codeSystem: 'ICD10CM', diagnosisCodeId: 6, diagnosisType: 'SECONDARY', notes: ' Mild ' },
    { codeSystem: 'AYURVEDA', ayurvedaDiagnosisCodeId: 3, diagnosisType: 'PRINCIPAL' },
  ],
};

describe('VisitDiagnosis validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitRepo.getVisitById.mockResolvedValue(visitWith('IN_CONSULTATION'));
    repo.listByVisit.mockResolvedValue([]);
    repo.getDiagnosisCodeReferences.mockResolvedValue([
      { id: 5, code: 'M06.9', isDeleted: false },
      { id: 6, code: 'M54.5', isDeleted: false },
    ]);
    repo.getAyurvedaDiagnosisCodeReferences.mockResolvedValue([
      { id: 3, code: 'AYU-AMV', isDeleted: false },
    ]);
  });

  describe('validateSaveVisitDiagnoses', () => {
    it('should not touch the repositories when the payload is invalid', async () => {
      const result = await validateSaveVisitDiagnoses('9', { diagnoses: 'x' }, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Diagnoses must be a list'] });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
      expect(repo.getDiagnosisCodeReferences).not.toHaveBeenCalled();
    });

    it('should report an invalid Visit id', async () => {
      await expect(validateSaveVisitDiagnoses('abc', payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
    });

    it('should return not found when the Visit is not in the Tenant', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateSaveVisitDiagnoses('9', payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });
      expect(visitRepo.getVisitById).toHaveBeenCalledWith(9, 'tenant-1');
    });

    it.each(['COMPLETED', 'CANCELLED'] as const)(
      'should reject a %s Visit as closed',
      async (status) => {
        visitRepo.getVisitById.mockResolvedValue(visitWith(status));

        await expect(validateSaveVisitDiagnoses('9', payload, 'tenant-1')).resolves.toEqual({
          success: false,
          errors: ['Visit VST-1001 is closed and cannot be edited.'],
          status: StatusCodes.CONFLICT,
        });
        expect(repo.getDiagnosisCodeReferences).not.toHaveBeenCalled();
      }
    );

    it('should return the parsed list for an Active Visit with valid references', async () => {
      const result = await validateSaveVisitDiagnoses('9', payload, 'tenant-1');

      expect(result).toMatchObject({
        success: true,
        data: {
          visitId: 9,
          diagnoses: [
            { codeSystem: 'ICD10CM', diagnosisCodeId: 5, ayurvedaDiagnosisCodeId: null },
            { codeSystem: 'ICD10CM', diagnosisCodeId: 6, notes: 'Mild' },
            { codeSystem: 'AYURVEDA', diagnosisCodeId: null, ayurvedaDiagnosisCodeId: 3 },
          ],
        },
      });
      expect(repo.getDiagnosisCodeReferences).toHaveBeenCalledWith('tenant-1', [5, 6]);
      expect(repo.getAyurvedaDiagnosisCodeReferences).toHaveBeenCalledWith('tenant-1', [3]);
      expect(repo.listByVisit).toHaveBeenCalledWith('tenant-1', 9);
    });

    it('should return conflicts for missing or deleted master rows', async () => {
      repo.getDiagnosisCodeReferences.mockResolvedValue([
        { id: 5, code: 'M06.9', isDeleted: true },
      ]);
      repo.getAyurvedaDiagnosisCodeReferences.mockResolvedValue([]);

      await expect(validateSaveVisitDiagnoses('9', payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: [
          'Diagnosis code 5 is Invalid.',
          'Diagnosis code 6 is Invalid.',
          'Ayurveda diagnosis code 3 is Invalid.',
        ],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should keep a deleted code that the Visit already records', async () => {
      repo.listByVisit.mockResolvedValue([recordedIcd]);
      repo.getDiagnosisCodeReferences.mockResolvedValue([
        { id: 5, code: 'M06.9', isDeleted: true },
        { id: 6, code: 'M54.5', isDeleted: false },
      ]);

      await expect(validateSaveVisitDiagnoses('9', payload, 'tenant-1')).resolves.toMatchObject({
        success: true,
      });
    });

    it('should reject the same code listed twice in a code system', async () => {
      const result = await validateSaveVisitDiagnoses(
        '9',
        {
          diagnoses: [
            { codeSystem: 'ICD10CM', diagnosisCodeId: 5, diagnosisType: 'PRINCIPAL' },
            { codeSystem: 'ICD10CM', diagnosisCodeId: 5, diagnosisType: 'SECONDARY' },
          ],
        },
        'tenant-1'
      );

      expect(result).toEqual({
        success: false,
        errors: ['Diagnosis code M06.9 is listed more than once.'],
      });
    });

    it('should skip the master lookups for an empty list', async () => {
      await expect(validateSaveVisitDiagnoses('9', { diagnoses: [] }, 'tenant-1')).resolves.toEqual(
        { success: true, data: { visitId: 9, diagnoses: [] } }
      );
      expect(repo.getDiagnosisCodeReferences).toHaveBeenCalledWith('tenant-1', []);
    });
  });

  describe('validateAmendVisitDiagnoses', () => {
    beforeEach(() => {
      visitRepo.getVisitById.mockResolvedValue(visitWith('COMPLETED'));
    });

    it('should accept a Completed Visit and carry its completion time', async () => {
      const completedAt = new Date('2026-07-15T11:00:00.000Z');
      visitRepo.getVisitById.mockResolvedValue({ ...visitWith('COMPLETED'), completedAt });

      await expect(validateAmendVisitDiagnoses('9', payload, 'tenant-1')).resolves.toMatchObject({
        success: true,
        data: { visitId: 9, visitCompletedAt: completedAt },
      });
    });

    it.each(['CHECKED_IN', 'IN_CONSULTATION', 'CANCELLED'] as const)(
      'should reject a %s Visit',
      async (status) => {
        visitRepo.getVisitById.mockResolvedValue(visitWith(status));

        await expect(validateAmendVisitDiagnoses('9', payload, 'tenant-1')).resolves.toEqual({
          success: false,
          errors: ['Visit VST-1001 is not completed and cannot be amended.'],
          status: StatusCodes.CONFLICT,
        });
        expect(repo.listByVisit).not.toHaveBeenCalled();
      }
    );

    it('should return not found for a missing Visit', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateAmendVisitDiagnoses('9', payload, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should not load the Visit when the payload is invalid', async () => {
      await validateAmendVisitDiagnoses('9', { diagnoses: [{ codeSystem: 'ICD10CM' }] }, 't-1');

      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should apply the same reference checks', async () => {
      repo.getAyurvedaDiagnosisCodeReferences.mockResolvedValue([]);

      await expect(validateAmendVisitDiagnoses('9', payload, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ayurveda diagnosis code 3 is Invalid.'],
        status: StatusCodes.CONFLICT,
      });
    });
  });

  describe('validateListVisitDiagnoses', () => {
    it('should report an invalid Visit id without loading the Visit', async () => {
      await expect(validateListVisitDiagnoses('x', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit x is Invalid.'],
      });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found for a Visit outside the Tenant', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateListVisitDiagnoses('9', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the parsed ids for any Visit status', async () => {
      visitRepo.getVisitById.mockResolvedValue(visitWith('COMPLETED'));

      await expect(validateListVisitDiagnoses('9', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { tenantId: 'tenant-1', visitId: 9 },
      });
    });
  });

  describe('getVisitDiagnosisConstraintErrors', () => {
    it('should map the Principal index violation to a retry message', () => {
      expect(
        getVisitDiagnosisConstraintErrors({
          cause: { code: '23505', constraint: 'visit_diagnosis_tenant_visit_principal_idx' },
        })
      ).toEqual(['Visit diagnoses were changed by another save. Reload and try again.']);
    });

    it('should ignore other database errors', () => {
      expect(getVisitDiagnosisConstraintErrors(new Error('database down'))).toEqual([]);
    });
  });
});
