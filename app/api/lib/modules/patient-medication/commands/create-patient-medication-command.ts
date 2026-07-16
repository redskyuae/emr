import type { CommandResult } from '@/app/api/lib/utils/types';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import type { PatientMedication } from '../schemas/patient-medication-schema';
import { validateCreatePatientMedication } from '../validator/create-patient-medication-validator';

export async function createPatientMedicationCommand(
  patientId: unknown,
  tenantId: string,
  recordedByUserId: string,
  payload: unknown
): Promise<CommandResult<PatientMedication>> {
  const validationResult = await validateCreatePatientMedication(patientId, tenantId, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const created = await patientMedicationRepository.createPatientMedication({
    ...validationResult.data.payload,
    tenantId,
    patientId: validationResult.data.patientId,
    recordedByUserId,
  });

  return { success: true, data: created };
}
