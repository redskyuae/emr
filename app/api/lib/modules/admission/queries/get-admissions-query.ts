import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission, AdmissionStatus } from '../schemas/admission-schema';
import { validateGetAdmissions } from '../validator/get-admissions-validator';

export type GetAdmissionsParams = {
  page?: number;
  limit?: number;
  query?: string;
  wardId?: number;
  doctorId?: number;
  patientId?: number;
  tenantId: unknown;
  status?: AdmissionStatus | string;
};

export async function getAdmissionsQuery({
  tenantId,
  ...params
}: GetAdmissionsParams): Promise<ListQueryResult<Admission>> {
  const validationResult = validateGetAdmissions(params, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const listParams = validationResult.data;

  // The census reads as "who is in the hospital right now", so an unfiltered
  // list defaults to Active Admissions. A patient-scoped list is their
  // admission history and must show closed stays too.
  if (listParams.status === undefined && listParams.patientId === undefined) {
    listParams.status = 'ADMITTED';
  }

  const { data, total } = await admissionRepository.getAdmissions(listParams);

  return { success: true, data, total };
}
