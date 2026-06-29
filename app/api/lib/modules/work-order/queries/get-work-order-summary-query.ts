import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { workOrderRepository } from '../repository/work-order-repository';
import type { WorkOrderSummary } from '../schemas/work-order-schema';
import { validateGetWorkOrderSummary } from '../validator/get-work-order-summary-validator';

type WorkOrderSummaryReader = Pick<typeof workOrderRepository, 'getWorkOrderSummary'>;

export async function getWorkOrderSummaryQuery(
  tenantId: unknown,
  repository: WorkOrderSummaryReader = workOrderRepository
): Promise<SingleQueryResult<WorkOrderSummary>> {
  const tenantResult = validateGetWorkOrderSummary(tenantId);

  if (!tenantResult.success) {
    return tenantResult;
  }

  const summary = await repository.getWorkOrderSummary(tenantResult.data);

  return { success: true, data: summary };
}
