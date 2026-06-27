import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import type { WorkOrderStatus } from '../schemas/work-order-status-schema';
import { validateGetWorkOrderStatuses } from '../validator/get-work-order-statuses-validator';

export type GetWorkOrderStatusesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getWorkOrderStatusesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetWorkOrderStatusesParams): Promise<ListQueryResult<WorkOrderStatus>> {
  const tenantIdValidationResult = validateGetWorkOrderStatuses(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await workOrderStatusRepository.getWorkOrderStatuses({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
