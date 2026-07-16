import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { patientAllergyRepository } from '../repository/patient-allergy-repository';
import type { PatientAllergy } from '../schemas/patient-allergy-schema';
import { validateGetPatientAllergies } from '../validator/get-patient-allergies-validator';

export type GetPatientAllergiesParams = {
  patientId: unknown;
  tenantId: unknown;
  page?: number;
  limit?: number;
};

export async function getPatientAllergiesQuery({
  patientId,
  tenantId,
  page,
  limit,
}: GetPatientAllergiesParams): Promise<ListQueryResult<PatientAllergy>> {
  const validationResult = validateGetPatientAllergies(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await patientAllergyRepository.getPatientAllergies({
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page,
    limit,
  });

  return { success: true, data, total };
}
