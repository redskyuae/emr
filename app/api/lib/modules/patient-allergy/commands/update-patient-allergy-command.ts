import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import type { PatientAllergy } from '../schemas/patient-allergy-schema';
import { validateUpdatePatientAllergy } from '../validator/update-patient-allergy-validator';

export async function updatePatientAllergyCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<PatientAllergy>> {
  const validationResult = await validateUpdatePatientAllergy(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updated = await patientAllergyRepository.updatePatientAllergy(validationResult.data.id, {
    ...validationResult.data.payload,
    tenantId,
  });

  if (!updated) {
    return { success: false, errors: ['Allergy not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updated };
}
