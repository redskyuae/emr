import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import type { PatientAllergy } from '../schemas/patient-allergy-schema';
import { validateDeletePatientAllergy } from '../validator/delete-patient-allergy-validator';

export async function deletePatientAllergyCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<PatientAllergy>> {
  const validationResult = validateDeletePatientAllergy(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await patientAllergyRepository.deletePatientAllergy(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Allergy not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleted };
}
