import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import type { PatientMedication } from '../schemas/patient-medication-schema';
import { validateGetPatientMedicationById } from '../validator/get-patient-medication-by-id-validator';

export async function getPatientMedicationByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<PatientMedication>> {
  const validationResult = validateGetPatientMedicationById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const medication = await patientMedicationRepository.getPatientMedicationById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!medication) {
    return { success: false, errors: ['Medication not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: medication };
}
