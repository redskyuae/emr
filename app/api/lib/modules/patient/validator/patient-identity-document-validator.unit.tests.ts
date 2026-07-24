import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientIdentityDocumentRepository } from '../repository/patient-identity-document-repository';
import { validatePatientIdentityDocumentOwnership } from './validate-patient-identity-documents';

vi.mock('../repository/patient-identity-document-repository', () => ({
  patientIdentityDocumentRepository: {
    findIdsForPatient: vi.fn(),
  },
}));

const repo = vi.mocked(patientIdentityDocumentRepository);

const passport = {
  documentType: 'passport' as const,
  documentNumber: 'J8369854',
  issuingCountryId: 1,
  expiryDate: '2029-04-11',
};

describe('Patient identity document ownership validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip the repository when no documents are submitted', async () => {
    await expect(
      validatePatientIdentityDocumentOwnership({ tenantId: 'tenant-1', patientId: 12 })
    ).resolves.toEqual({ success: true, data: undefined });
    expect(repo.findIdsForPatient).not.toHaveBeenCalled();
  });

  it('should skip the repository when every document is new', async () => {
    await expect(
      validatePatientIdentityDocumentOwnership({
        tenantId: 'tenant-1',
        patientId: 12,
        identityDocuments: [passport],
      })
    ).resolves.toEqual({ success: true, data: undefined });
    expect(repo.findIdsForPatient).not.toHaveBeenCalled();
  });

  it('should succeed when every submitted id belongs to the patient', async () => {
    repo.findIdsForPatient.mockResolvedValue([91]);

    await expect(
      validatePatientIdentityDocumentOwnership({
        tenantId: 'tenant-1',
        patientId: 12,
        identityDocuments: [{ ...passport, id: 91 }],
      })
    ).resolves.toEqual({ success: true, data: undefined });

    expect(repo.findIdsForPatient).toHaveBeenCalledWith('tenant-1', 12, [91]);
  });

  it('should reject a document id owned by a different patient in the same tenant', async () => {
    // The repository is scoped by patient as well as tenant, so a document
    // belonging to patient 900 simply does not come back for patient 12.
    repo.findIdsForPatient.mockResolvedValue([]);

    await expect(
      validatePatientIdentityDocumentOwnership({
        tenantId: 'tenant-1',
        patientId: 12,
        identityDocuments: [{ ...passport, id: 777 }],
      })
    ).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Identity document 777 was not found for this Patient.'],
    });
  });

  it('should reject a document id owned by another tenant', async () => {
    // Without this check, PUT /patients/12 carrying another tenant's document
    // id would rewrite their data (ADR 0043).
    repo.findIdsForPatient.mockResolvedValue([]);

    const result = await validatePatientIdentityDocumentOwnership({
      tenantId: 'tenant-1',
      patientId: 12,
      identityDocuments: [{ ...passport, id: 4242 }],
    });

    expect(result.success).toBe(false);
    // Identical wording to the same-tenant case on purpose: the response must
    // not confirm that another tenant's row exists.
    expect(result.success === false && result.errors).toEqual([
      'Identity document 4242 was not found for this Patient.',
    ]);
  });

  it('should reject the whole payload when only some ids are unowned', async () => {
    repo.findIdsForPatient.mockResolvedValue([91]);

    await expect(
      validatePatientIdentityDocumentOwnership({
        tenantId: 'tenant-1',
        patientId: 12,
        identityDocuments: [
          { ...passport, id: 91 },
          { ...passport, id: 92 },
        ],
      })
    ).resolves.toMatchObject({
      success: false,
      errors: ['Identity document 92 was not found for this Patient.'],
    });
  });
});
