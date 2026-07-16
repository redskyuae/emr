import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import type { PatientMedication } from '../schemas/patient-medication-schema';
import { validateDeletePatientMedication } from '../validator/delete-patient-medication-validator';

export async function deletePatientMedicationCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<PatientMedication>> {
  const validationResult = validateDeletePatientMedication(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deleted = await patientMedicationRepository.deletePatientMedication(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Medication not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: deleted };
}
