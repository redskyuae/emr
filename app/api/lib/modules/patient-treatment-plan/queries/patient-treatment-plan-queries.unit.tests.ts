import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import { validateGetPatientTreatmentPlans } from '../validator/patient-treatment-plan-validator';
import { getPatientTreatmentPlansQuery } from './get-patient-treatment-plans-query';

vi.mock('../repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { getCurrentByPatientId: vi.fn() },
}));
vi.mock('../validator/patient-treatment-plan-validator', () => ({
  validateGetPatientTreatmentPlans: vi.fn(),
}));

const repo = vi.mocked(patientTreatmentPlanRepository);
const validate = vi.mocked(validateGetPatientTreatmentPlans);
const plan = {
  id: 1,
  tenantId: 'tenant-a',
  patientId: 12,
  treatmentId: 10,
  treatmentName: 'Abhyanga',
  treatmentCode: 'ABH',
  treatmentSourceIdentity: null,
  sessionStructure: 'REPEATABLE' as const,
  totalSessions: 2,
  statusOverride: null,
  legacySourceIdentity: null,
  legacySourceSystem: null,
  legacySourceKey: null,
  legacySourceContentHash: null,
  sourceImportBatchId: null,
  legacyVisitId: null,
  legacyVisitNumber: null,
  importBatchId: null,
  createdOn: new Date('2026-09-16T00:00:00Z'),
  modifiedOn: new Date('2026-09-16T00:00:00Z'),
  status: 'PENDING' as const,
  completedSessions: 0,
  sessions: [],
};

describe('Patient Treatment Plan queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({
      success: true,
      data: { patientId: 12, tenantId: 'tenant-a', status: 'current' },
    });
    repo.getCurrentByPatientId.mockResolvedValue([plan]);
  });

  it('should short-circuit without reading Plans when validation fails', async () => {
    validate.mockResolvedValue({ success: false, errors: ['Invalid request'] });

    await expect(getPatientTreatmentPlansQuery('bad', 'tenant-a', 'current')).resolves.toEqual({
      success: false,
      errors: ['Invalid request'],
    });
    expect(repo.getCurrentByPatientId).not.toHaveBeenCalled();
  });

  it('should preserve the not-found status for a missing Tenant-scoped Patient', async () => {
    validate.mockResolvedValue({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    });

    await expect(getPatientTreatmentPlansQuery('12', 'tenant-a', 'current')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    });
    expect(repo.getCurrentByPatientId).not.toHaveBeenCalled();
  });

  it('should return the current Plan read model for the normalized Patient and Tenant', async () => {
    await expect(getPatientTreatmentPlansQuery('12', ' tenant-a ', 'current')).resolves.toEqual({
      success: true,
      data: [plan],
    });
    expect(validate).toHaveBeenCalledWith('12', ' tenant-a ', 'current');
    expect(repo.getCurrentByPatientId).toHaveBeenCalledWith(12, 'tenant-a');
  });

  it('should return an empty successful result when the Patient has no current Plans', async () => {
    repo.getCurrentByPatientId.mockResolvedValue([]);

    await expect(getPatientTreatmentPlansQuery('12', 'tenant-a', 'current')).resolves.toEqual({
      success: true,
      data: [],
    });
  });
});
