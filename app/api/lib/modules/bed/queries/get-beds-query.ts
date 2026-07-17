import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { bedRepository } from '../repository/bed-repository';
import type { Bed, BedStatus } from '../schemas/bed-schema';
import { validateGetBeds } from '../validator/get-beds-validator';

export type GetBedsParams = {
  page?: number;
  limit?: number;
  query?: string;
  wardId?: number;
  tenantId: unknown;
  status?: BedStatus;
};

export async function getBedsQuery({
  tenantId,
  page,
  limit,
  query,
  wardId,
  status,
}: GetBedsParams): Promise<ListQueryResult<Bed>> {
  const tenantIdValidationResult = validateGetBeds(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await bedRepository.getBeds({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
    wardId,
    status,
  });

  return { success: true, data, total };
}
