import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import type { PatientAllergy } from '../schemas/patient-allergy-schema';
import { validateCreatePatientAllergy } from '../validator/create-patient-allergy-validator';

export async function createPatientAllergyCommand(
  patientId: unknown,
  tenantId: string,
  recordedByUserId: string,
  payload: unknown
): Promise<CommandResult<PatientAllergy>> {
  const validationResult = await validateCreatePatientAllergy(patientId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const created = await patientAllergyRepository.createPatientAllergy({
    ...validationResult.data.payload,
    tenantId,
    patientId: validationResult.data.patientId,
    recordedByUserId,
  });

  return { success: true, data: created };
}
