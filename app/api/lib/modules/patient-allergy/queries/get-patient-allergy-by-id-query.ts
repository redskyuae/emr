import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import type { PatientAllergy } from '../schemas/patient-allergy-schema';
import { validateGetPatientAllergyById } from '../validator/get-patient-allergy-by-id-validator';

export async function getPatientAllergyByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<PatientAllergy>> {
  const validationResult = validateGetPatientAllergyById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const allergy = await patientAllergyRepository.getPatientAllergyById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!allergy) {
    return { success: false, errors: ['Allergy not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: allergy };
}
