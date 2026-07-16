import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createPatientAllergySchema,
  patientAllergyIdSchema,
  type CreatePatientAllergyInput,
} from '../schemas/patient-allergy-schema';
import {
  validateAllergenReference,
  validatePatientExistsForAllergy,
} from './patient-allergy-reference-validator';

export async function validateCreatePatientAllergy(
  patientId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<{ patientId: number; payload: CreatePatientAllergyInput }>> {
  const patientIdResult = patientAllergyIdSchema.safeParse(patientId);
  const payloadResult = createPatientAllergySchema.safeParse(payload);

  if (!patientIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const patientResult = await validatePatientExistsForAllergy(patientIdResult.data, tenantId);

  if (!patientResult.success) {
    return patientResult;
  }

  const allergenResult = await validateAllergenReference(payloadResult.data.allergenId, tenantId);

  if (!allergenResult.success) {
    return allergenResult;
  }

  return { success: true, data: { patientId: patientIdResult.data, payload: payloadResult.data } };
}
