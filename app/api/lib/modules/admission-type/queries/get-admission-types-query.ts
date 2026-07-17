import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import type { AdmissionType } from '../schemas/admission-type-schema';
import { validateGetAdmissionTypes } from '../validator/get-admission-types-validator';

export type GetAdmissionTypesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getAdmissionTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAdmissionTypesParams): Promise<ListQueryResult<AdmissionType>> {
  const tenantIdValidationResult = validateGetAdmissionTypes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await admissionTypeRepository.getAdmissionTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
