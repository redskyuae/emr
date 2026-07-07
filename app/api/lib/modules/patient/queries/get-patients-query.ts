import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../repository/patient-repository';
import type { Patient, PatientGender } from '../schemas/patient-schema';
import { validateGetPatients } from '../validator/get-patients-validator';

export type GetPatientsParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
  gender?: PatientGender;
  isActive?: boolean;
};

export async function getPatientsQuery({
  tenantId,
  page,
  limit,
  query,
  gender,
  isActive,
}: GetPatientsParams): Promise<ListQueryResult<Patient>> {
  const tenantIdValidationResult = validateGetPatients(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await patientRepository.getPatients({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    gender,
    isActive,
  });

  return { success: true, data, total };
}
