import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import {
  patientAllergyIdSchema,
  updatePatientAllergySchema,
  type UpdatePatientAllergyInput,
} from '../schemas/patient-allergy-schema';
import { validateAllergenReference } from './patient-allergy-reference-validator';

export type UpdatePatientAllergyParams = {
  id: number;
  payload: UpdatePatientAllergyInput;
};

export async function validateUpdatePatientAllergy(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdatePatientAllergyParams>> {
  const idResult = patientAllergyIdSchema.safeParse(id);
  const payloadResult = updatePatientAllergySchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Allergy ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existing = await patientAllergyRepository.getPatientAllergyById(idResult.data, tenantId);

  if (!existing) {
    return { success: false, errors: ['Allergy not found'], status: StatusCodes.NOT_FOUND };
  }

  const allergenResult = await validateAllergenReference(payloadResult.data.allergenId, tenantId);

  if (!allergenResult.success) {
    return allergenResult;
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
