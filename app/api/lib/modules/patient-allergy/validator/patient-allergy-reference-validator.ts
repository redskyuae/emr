import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../../allergen/repository/allergen-repository';
import { patientRepository } from '../../patient/repository/patient-repository';

export async function validatePatientExistsForAllergy(
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const patient = await patientRepository.getPatientById(patientId, tenantId);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}

export async function validateAllergenReference(
  allergenId: number | undefined,
  tenantId: string
): Promise<ValidationResult<void>> {
  if (allergenId === undefined) {
    return { success: true, data: undefined };
  }

  const allergen = await allergenRepository.getAllergenById(allergenId, tenantId);

  if (!allergen) {
    return {
      success: false,
      errors: [`Allergen ${allergenId} does not exist.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  return { success: true, data: undefined };
}
