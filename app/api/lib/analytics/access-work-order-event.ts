// `work_order_created` sends the Work Order type and priority codes. The created Work Order carries
// only their names, so the codes are read after the response is sent. The Work Order's own code,
// note, technician and Asset are never sent.

import {
  analyticsActorFromSession,
  recordServerEventAfterLookup,
} from '@/app/api/lib/analytics/server-analytics';
import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { getWorkOrderPriorityByIdQuery } from '@/app/api/lib/modules/work-order-priority/queries/get-work-order-priority-by-id-query';
import { getWorkOrderTypeByIdQuery } from '@/app/api/lib/modules/work-order-type/queries/get-work-order-type-by-id-query';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

export function recordWorkOrderCreated(
  tenantSession: TenantSession,
  request: Request,
  workOrder: Pick<WorkOrder, 'typeId' | 'priorityId'>
) {
  recordServerEventAfterLookup(
    analyticsActorFromSession(tenantSession, request),
    'work_order_created',
    async () => {
      const [type, priority] = await Promise.all([
        getWorkOrderTypeByIdQuery(workOrder.typeId, tenantSession.tenantId),
        getWorkOrderPriorityByIdQuery(workOrder.priorityId, tenantSession.tenantId),
      ]);

      // A Master deleted in the meantime still leaves the outcome recorded, without its code.
      return {
        work_order_type_code: type.success ? type.data.code : null,
        work_order_priority_code: priority.success ? priority.data.code : null,
      };
    }
  );
}
