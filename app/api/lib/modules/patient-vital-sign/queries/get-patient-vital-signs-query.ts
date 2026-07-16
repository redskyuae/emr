import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import type { PatientVitalSign } from '../schemas/patient-vital-sign-schema';
import { validateGetPatientVitalSigns } from '../validator/get-patient-vital-signs-validator';

export type GetPatientVitalSignsParams = {
  patientId: unknown;
  tenantId: unknown;
  page?: number;
  limit?: number;
};

export async function getPatientVitalSignsQuery({
  patientId,
  tenantId,
  page,
  limit,
}: GetPatientVitalSignsParams): Promise<ListQueryResult<PatientVitalSign>> {
  const validationResult = validateGetPatientVitalSigns(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await patientVitalSignRepository.getPatientVitalSigns({
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page,
    limit,
  });

  return { success: true, data, total };
}
