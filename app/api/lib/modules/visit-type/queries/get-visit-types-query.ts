import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { visitTypeRepository } from '../repository/visit-type-repository';
import type { VisitType } from '../schemas/visit-type-schema';
import { validateGetVisitTypes } from '../validator/get-visit-types-validator';

export type GetVisitTypesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getVisitTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetVisitTypesParams): Promise<ListQueryResult<VisitType>> {
  const tenantIdValidationResult = validateGetVisitTypes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await visitTypeRepository.getVisitTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
