import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { workOrderRepository } from '../repository/work-order-repository';
import type { WorkOrder } from '../schemas/work-order-schema';
import { validateGetWorkOrders } from '../validator/get-work-orders-validator';

export type GetWorkOrdersParams = {
  page?: number;
  query?: string;
  limit?: number;
  typeId?: number;
  assetId?: number;
  tenantId: unknown;
  statusId?: number;
  priorityId?: number;
};

export async function getWorkOrdersQuery({
  tenantId,
  page,
  limit,
  query,
  typeId,
  priorityId,
  statusId,
  assetId,
}: GetWorkOrdersParams): Promise<ListQueryResult<WorkOrder>> {
  const tenantResult = validateGetWorkOrders(tenantId);

  if (!tenantResult.success) {
    return tenantResult;
  }

  const { data, total } = await workOrderRepository.getWorkOrders({
    tenantId: tenantResult.data,
    page,
    limit,
    query,
    typeId,
    priorityId,
    statusId,
    assetId,
  });

  return { success: true, data, total };
}
