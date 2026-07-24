import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientIdentityDocumentRepository } from '../repository/patient-identity-document-repository';
import type { PatientIdentityDocumentInput } from '../schemas/patient-schema';

const IDENTITY_DOCUMENT_NOT_FOUND = 'Identity document {value} was not found for this Patient.';

type IdentityDocumentOwnershipInput = {
  tenantId: string;
  patientId: number;
  identityDocuments?: PatientIdentityDocumentInput[];
};

// The replace is diffed by client-supplied document id, so every id must be
// proven to belong to THIS patient within THIS tenant before the command
// touches it. Without this check, `PUT /patients/12` carrying a document id
// owned by a patient in another tenant rewrites their data (ADR 0043).
export async function validatePatientIdentityDocumentOwnership({
  tenantId,
  patientId,
  identityDocuments,
}: IdentityDocumentOwnershipInput): Promise<ValidationResult<void>> {
  const submittedIds = (identityDocuments ?? [])
    .map((document) => document.id)
    .filter((id): id is number => id !== undefined);

  if (submittedIds.length === 0) {
    return { success: true, data: undefined };
  }

  const ownedIds = await patientIdentityDocumentRepository.findIdsForPatient(
    tenantId,
    patientId,
    submittedIds
  );

  const ownedIdSet = new Set(ownedIds);
  const unownedIds = submittedIds.filter((id) => !ownedIdSet.has(id));

  if (unownedIds.length > 0) {
    return {
      success: false,
      // Deliberately identical wording whether the document belongs to another
      // patient, another tenant, or does not exist — the response must not
      // confirm that some other tenant's row exists.
      errors: unownedIds.map((id) => IDENTITY_DOCUMENT_NOT_FOUND.replace('{value}', String(id))),
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: undefined };
}
