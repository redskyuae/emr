import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../schemas/visit-diagnosis-schema';
import { validateListVisitDiagnoses } from '../validator/list-visit-diagnoses-validator';
import { listVisitDiagnosesQuery } from './list-visit-diagnoses-query';

vi.mock('../repository/visit-diagnosis-repository', () => ({
  visitDiagnosisRepository: { listByVisit: vi.fn() },
}));
vi.mock('../validator/list-visit-diagnoses-validator', () => ({
  validateListVisitDiagnoses: vi.fn(),
}));

const repo = vi.mocked(visitDiagnosisRepository);
const validateList = vi.mocked(validateListVisitDiagnoses);
const diagnosis: VisitDiagnosis = {
  id: 2,
  visitId: 9,
  codeSystem: 'AYURVEDA',
  diagnosisType: 'PRINCIPAL',
  sortOrder: 1,
  notes: null,
  code: 'AYU-AMV',
  title: 'Amavata',
  englishName: 'Rheumatoid arthritis',
  diagnosisCodeId: null,
  ayurvedaDiagnosisCodeId: 3,
  icdMapping: { id: 5, code: 'M06.9', title: 'Rheumatoid arthritis, unspecified' },
};

describe('VisitDiagnosis queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateList.mockResolvedValue({ success: true, data: { tenantId: 'tenant-1', visitId: 9 } });
    repo.listByVisit.mockResolvedValue([diagnosis]);
  });

  it('should short-circuit with the validator status and not read', async () => {
    validateList.mockResolvedValue({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await expect(listVisitDiagnosesQuery('9', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(repo.listByVisit).not.toHaveBeenCalled();
  });

  it('should return the Visit diagnoses as a list result', async () => {
    await expect(listVisitDiagnosesQuery('9', 'tenant-1')).resolves.toEqual({
      success: true,
      data: [diagnosis],
      total: 1,
    });
    expect(validateList).toHaveBeenCalledWith('9', 'tenant-1');
    expect(repo.listByVisit).toHaveBeenCalledWith('tenant-1', 9);
  });
});
