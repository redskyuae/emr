import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { wardRepository } from '../repository/ward-repository';
import type { Ward } from '../schemas/ward-schema';
import { validateGetWards } from '../validator/get-wards-validator';

export type GetWardsParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getWardsQuery({
  tenantId,
  page,
  limit,
  query,
}: GetWardsParams): Promise<ListQueryResult<Ward>> {
  const tenantIdValidationResult = validateGetWards(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await wardRepository.getWards({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
