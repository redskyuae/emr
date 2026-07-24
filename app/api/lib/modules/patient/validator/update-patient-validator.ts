import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientRepository } from '../repository/patient-repository';
import {
  patientIdSchema,
  type UpdatePatientInput,
  updatePatientSchema,
} from '../schemas/patient-schema';
import { validatePatientEmiratesIdUniqueness } from './patient-emirates-id-validator';
import { validatePatientReferences } from './patient-reference-validator';
import { validatePatientIdentityDocumentOwnership } from './validate-patient-identity-documents';

export type UpdatePatientParams = {
  id: number;
  payload: UpdatePatientInput;
};

export async function validateUpdatePatient(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<UpdatePatientParams>> {
  const idResult = patientIdSchema.safeParse(id);
  const payloadResult = updatePatientSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Patient ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingPatient = await patientRepository.getPatientById(idResult.data, tenantId);

  if (!existingPatient) {
    return {
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const referenceResult = await validatePatientReferences(payloadResult.data);

  if (!referenceResult.success) {
    return {
      success: false,
      errors: referenceResult.errors,
      status: referenceResult.status,
    };
  }

  const uniquenessResult = await validatePatientEmiratesIdUniqueness({
    tenantId,
    emiratesId: payloadResult.data.emiratesId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  // Every client-supplied document id must be proven to belong to this Patient
  // in this Tenant before the command updates it (ADR 0043).
  const ownershipResult = await validatePatientIdentityDocumentOwnership({
    tenantId,
    patientId: idResult.data,
    identityDocuments: payloadResult.data.identityDocuments,
  });

  if (!ownershipResult.success) {
    return {
      success: false,
      errors: ownershipResult.errors,
      status: ownershipResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
