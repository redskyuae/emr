import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import type { WorkOrderType } from '../schemas/work-order-type-schema';
import { validateGetWorkOrderTypes } from '../validator/get-work-order-types-validator';

export type GetWorkOrderTypesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getWorkOrderTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetWorkOrderTypesParams): Promise<ListQueryResult<WorkOrderType>> {
  const tenantIdValidationResult = validateGetWorkOrderTypes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await workOrderTypeRepository.getWorkOrderTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
