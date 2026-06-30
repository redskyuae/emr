import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';
import type { Specialty } from '../schemas/specialty-schema';
import { validateGetSpecialties } from '../validator/get-specialties-validator';

export type GetSpecialtiesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getSpecialtiesQuery({
  page,
  limit,
  query,
  tenantId,
}: GetSpecialtiesParams): Promise<ListQueryResult<Specialty>> {
  const tenantIdValidationResult = validateGetSpecialties(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await specialtyRepository.getSpecialties({
    page,
    limit,
    query,
    tenantId: tenantIdValidationResult.data,
  });

  return { success: true, data, total };
}
