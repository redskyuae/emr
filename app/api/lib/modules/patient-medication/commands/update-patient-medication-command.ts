import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import type { PatientMedication } from '../schemas/patient-medication-schema';
import { validateUpdatePatientMedication } from '../validator/update-patient-medication-validator';

export async function updatePatientMedicationCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<PatientMedication>> {
  const validationResult = await validateUpdatePatientMedication(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const updated = await patientMedicationRepository.updatePatientMedication(
    validationResult.data.id,
    { ...validationResult.data.payload, tenantId }
  );

  if (!updated) {
    return { success: false, errors: ['Medication not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updated };
}
