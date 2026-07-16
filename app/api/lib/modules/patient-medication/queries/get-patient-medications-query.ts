import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { patientMedicationRepository } from '../repository/patient-medication-repository';
import type { PatientMedication } from '../schemas/patient-medication-schema';
import { validateGetPatientMedications } from '../validator/get-patient-medications-validator';

export type GetPatientMedicationsParams = {
  patientId: unknown;
  tenantId: unknown;
  page?: number;
  limit?: number;
};

export async function getPatientMedicationsQuery({
  patientId,
  tenantId,
  page,
  limit,
}: GetPatientMedicationsParams): Promise<ListQueryResult<PatientMedication>> {
  const validationResult = validateGetPatientMedications(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await patientMedicationRepository.getPatientMedications({
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page,
    limit,
  });

  return { success: true, data, total };
}
