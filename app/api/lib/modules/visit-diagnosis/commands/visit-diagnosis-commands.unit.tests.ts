import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis, VisitDiagnosisEntry } from '../schemas/visit-diagnosis-schema';
import { validateAmendVisitDiagnoses } from '../validator/amend-visit-diagnoses-validator';
import { validateSaveVisitDiagnoses } from '../validator/save-visit-diagnoses-validator';
import { amendVisitDiagnosesCommand } from './amend-visit-diagnoses-command';
import { saveVisitDiagnosesCommand } from './save-visit-diagnoses-command';

vi.mock('../repository/visit-diagnosis-repository', () => ({
  visitDiagnosisRepository: { replaceVisitDiagnoses: vi.fn() },
}));
vi.mock('../validator/save-visit-diagnoses-validator', () => ({
  validateSaveVisitDiagnoses: vi.fn(),
}));
vi.mock('../validator/amend-visit-diagnoses-validator', () => ({
  validateAmendVisitDiagnoses: vi.fn(),
}));

const repo = vi.mocked(visitDiagnosisRepository);
const validateSave = vi.mocked(validateSaveVisitDiagnoses);
const validateAmend = vi.mocked(validateAmendVisitDiagnoses);

const diagnoses: VisitDiagnosisEntry[] = [
  {
    codeSystem: 'ICD10CM',
    diagnosisCodeId: 5,
    ayurvedaDiagnosisCodeId: null,
    diagnosisType: 'PRINCIPAL',
    notes: null,
  },
];
const saved: VisitDiagnosis[] = [
  {
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
  },
];
const principalViolation = {
  cause: { code: '23505', constraint: 'visit_diagnosis_tenant_visit_principal_idx' },
};

describe.each([
  { name: 'saveVisitDiagnosesCommand', command: saveVisitDiagnosesCommand, validate: validateSave },
  {
    name: 'amendVisitDiagnosesCommand',
    command: amendVisitDiagnosesCommand,
    validate: validateAmend,
  },
])('$name', ({ command, validate }) => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: { visitId: 9, diagnoses } });
    repo.replaceVisitDiagnoses.mockResolvedValue(saved);
  });

  it('should return the validation failure with its status and not write', async () => {
    validate.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is closed and cannot be edited.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(command('9', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Visit VST-1001 is closed and cannot be edited.'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.replaceVisitDiagnoses).not.toHaveBeenCalled();
  });

  it('should validate first, then replace the list and return the saved read model', async () => {
    const body = { diagnoses: [] };

    await expect(command('9', 'tenant-1', body)).resolves.toEqual({ success: true, data: saved });
    expect(validate).toHaveBeenCalledWith('9', body, 'tenant-1');
    expect(repo.replaceVisitDiagnoses).toHaveBeenCalledWith('tenant-1', 9, diagnoses);
  });

  it('should map a Principal index race to a conflict', async () => {
    repo.replaceVisitDiagnoses.mockRejectedValue(principalViolation);

    await expect(command('9', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Visit diagnoses were changed by another save. Reload and try again.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.replaceVisitDiagnoses.mockRejectedValue(error);

    await expect(command('9', 'tenant-1', {})).rejects.toThrow(error);
  });
});

describe('amendVisitDiagnosesCommand internals', () => {
  it('should return when the amended Visit was completed beside the saved list', async () => {
    const visitCompletedAt = new Date('2026-07-15T11:00:00.000Z');
    validateAmend.mockResolvedValue({
      success: true,
      data: { visitId: 9, diagnoses, visitCompletedAt },
    });
    repo.replaceVisitDiagnoses.mockResolvedValue(saved);

    await expect(amendVisitDiagnosesCommand('9', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: saved,
      visitCompletedAt,
    });
  });
});
