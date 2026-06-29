import { and, count, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { asset as assetTable } from '@/app/db/schema/asset';
import {
  workOrder as workOrderTable,
  workOrderCodeCounter as workOrderCodeCounterTable,
} from '@/app/db/schema/work-order';
import { workOrderPriority as workOrderPriorityTable } from '@/app/db/schema/work-order-priority';
import { workOrderStatus as workOrderStatusTable } from '@/app/db/schema/work-order-status';
import { workOrderType as workOrderTypeTable } from '@/app/db/schema/work-order-type';
import type {
  WorkOrderSummary,
  CreateWorkOrderData,
  WorkOrderListParams,
} from '../schemas/work-order-schema';
import { formatWorkOrderCode } from './work-order-code';
import { initialCompletedOn } from './work-order-completion';

const workOrderColumns = {
  id: workOrderTable.id,
  code: workOrderTable.code,
  note: workOrderTable.note,
  type: {
    id: workOrderTypeTable.id,
    name: workOrderTypeTable.name,
    color: workOrderTypeTable.color,
  },
  asset: {
    id: assetTable.id,
    name: assetTable.name,
    model: assetTable.model,
    serialNumber: assetTable.serialNumber,
  },
  typeId: workOrderTable.typeId,
  dueDate: workOrderTable.dueDate,
  assetId: workOrderTable.assetId,
  priority: {
    id: workOrderPriorityTable.id,
    name: workOrderPriorityTable.name,
    color: workOrderPriorityTable.color,
  },
  tenantId: workOrderTable.tenantId,
  statusId: workOrderTable.statusId,
  createdOn: workOrderTable.createdOn,
  technician: workOrderTable.technician,
  priorityId: workOrderTable.priorityId,
  modifiedOn: workOrderTable.modifiedOn,
  completedOn: workOrderTable.completedOn,
  status: {
    id: workOrderStatusTable.id,
    name: workOrderStatusTable.name,
    category: workOrderStatusTable.category,
    color: workOrderStatusTable.color,
  },
};

type SelectExecutor = Pick<typeof db, 'select'>;

const workOrderJoins = (executor: SelectExecutor = db) =>
  executor
    .select(workOrderColumns)
    .from(workOrderTable)
    .innerJoin(
      workOrderTypeTable,
      and(
        eq(workOrderTypeTable.id, workOrderTable.typeId),
        eq(workOrderTypeTable.tenantId, workOrderTable.tenantId),
        eq(workOrderTypeTable.isDeleted, false)
      )
    )
    .innerJoin(
      workOrderPriorityTable,
      and(
        eq(workOrderPriorityTable.id, workOrderTable.priorityId),
        eq(workOrderPriorityTable.tenantId, workOrderTable.tenantId),
        eq(workOrderPriorityTable.isDeleted, false)
      )
    )
    .innerJoin(
      workOrderStatusTable,
      and(
        eq(workOrderStatusTable.id, workOrderTable.statusId),
        eq(workOrderStatusTable.tenantId, workOrderTable.tenantId),
        eq(workOrderStatusTable.isDeleted, false)
      )
    )
    .innerJoin(
      assetTable,
      and(
        eq(assetTable.id, workOrderTable.assetId),
        eq(assetTable.tenantId, workOrderTable.tenantId)
      )
    );

async function getWorkOrderById(id: number, tenantId: string, executor: SelectExecutor = db) {
  const [workOrder] = await workOrderJoins(executor)
    .where(
      and(
        eq(workOrderTable.id, id),
        eq(workOrderTable.tenantId, tenantId),
        eq(workOrderTable.isDeleted, false)
      )
    )
    .limit(1);

  return workOrder;
}

export type CreateWorkOrderRepositoryResult =
  | { success: true; data: NonNullable<Awaited<ReturnType<typeof getWorkOrderById>>> }
  | {
      success: false;
      invalidReferences: Array<'asset' | 'type' | 'priority' | 'status'>;
    };

async function createWorkOrder(
  data: CreateWorkOrderData
): Promise<CreateWorkOrderRepositoryResult> {
  return db.transaction(async (tx) => {
    const invalidReferences: Array<'asset' | 'type' | 'priority' | 'status'> = [];

    const [asset] = await tx
      .select({ id: assetTable.id })
      .from(assetTable)
      .where(
        and(
          eq(assetTable.id, data.assetId),
          eq(assetTable.tenantId, data.tenantId),
          eq(assetTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!asset) invalidReferences.push('asset');

    const [type] = await tx
      .select({ id: workOrderTypeTable.id })
      .from(workOrderTypeTable)
      .where(
        and(
          eq(workOrderTypeTable.id, data.typeId),
          eq(workOrderTypeTable.tenantId, data.tenantId),
          eq(workOrderTypeTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!type) invalidReferences.push('type');

    const [priority] = await tx
      .select({ id: workOrderPriorityTable.id })
      .from(workOrderPriorityTable)
      .where(
        and(
          eq(workOrderPriorityTable.id, data.priorityId),
          eq(workOrderPriorityTable.tenantId, data.tenantId),
          eq(workOrderPriorityTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!priority) invalidReferences.push('priority');

    const [status] = await tx
      .select({ id: workOrderStatusTable.id, category: workOrderStatusTable.category })
      .from(workOrderStatusTable)
      .where(
        and(
          eq(workOrderStatusTable.id, data.statusId),
          eq(workOrderStatusTable.tenantId, data.tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!status) invalidReferences.push('status');

    if (invalidReferences.length > 0 || !status) {
      return { success: false, invalidReferences };
    }

    const [counter] = await tx
      .insert(workOrderCodeCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: workOrderCodeCounterTable.tenantId,
        set: { lastNumber: sql`${workOrderCodeCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: workOrderCodeCounterTable.lastNumber });

    const [createdWorkOrder] = await tx
      .insert(workOrderTable)
      .values({
        tenantId: data.tenantId,
        code: formatWorkOrderCode(counter.lastNumber),
        assetId: data.assetId,
        typeId: data.typeId,
        priorityId: data.priorityId,
        statusId: data.statusId,
        technician: data.technician ?? null,
        dueDate: data.dueDate ?? null,
        completedOn: initialCompletedOn(status.category, new Date()),
        note: data.note ?? null,
      })
      .returning({ id: workOrderTable.id });

    const created = await getWorkOrderById(createdWorkOrder.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Work Order could not be read');
    }

    return { success: true, data: created };
  });
}

async function getWorkOrders({
  tenantId,
  page = 1,
  limit = 10,
  query,
  typeId,
  priorityId,
  statusId,
  assetId,
}: WorkOrderListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(workOrderTable.code, `%${trimmedQuery}%`),
        ilike(assetTable.name, `%${trimmedQuery}%`),
        ilike(assetTable.model, `%${trimmedQuery}%`),
        ilike(workOrderTable.technician, `%${trimmedQuery}%`),
        ilike(workOrderTable.note, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(workOrderTable.tenantId, tenantId),
    eq(workOrderTable.isDeleted, false),
    typeId ? eq(workOrderTable.typeId, typeId) : undefined,
    priorityId ? eq(workOrderTable.priorityId, priorityId) : undefined,
    statusId ? eq(workOrderTable.statusId, statusId) : undefined,
    assetId ? eq(workOrderTable.assetId, assetId) : undefined,
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    workOrderJoins()
      .where(whereClause)
      .orderBy(desc(workOrderTable.createdOn), desc(workOrderTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(workOrderTable)
      .innerJoin(
        workOrderTypeTable,
        and(
          eq(workOrderTypeTable.id, workOrderTable.typeId),
          eq(workOrderTypeTable.tenantId, workOrderTable.tenantId),
          eq(workOrderTypeTable.isDeleted, false)
        )
      )
      .innerJoin(
        workOrderPriorityTable,
        and(
          eq(workOrderPriorityTable.id, workOrderTable.priorityId),
          eq(workOrderPriorityTable.tenantId, workOrderTable.tenantId),
          eq(workOrderPriorityTable.isDeleted, false)
        )
      )
      .innerJoin(
        workOrderStatusTable,
        and(
          eq(workOrderStatusTable.id, workOrderTable.statusId),
          eq(workOrderStatusTable.tenantId, workOrderTable.tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .innerJoin(
        assetTable,
        and(
          eq(assetTable.id, workOrderTable.assetId),
          eq(assetTable.tenantId, workOrderTable.tenantId)
        )
      )
      .where(whereClause),
  ]);

  return { data, total };
}

async function getWorkOrderSummary(tenantId: string): Promise<WorkOrderSummary> {
  const [summary] = await db
    .select({
      activeCount:
        sql<number>`count(*) filter (where ${workOrderStatusTable.category} <> 'COMPLETED')`.mapWith(
          Number
        ),
      overdueCount:
        sql<number>`count(*) filter (where ${workOrderStatusTable.category} = 'OVERDUE')`.mapWith(
          Number
        ),
      dueNext7DaysCount:
        sql<number>`count(*) filter (where ${workOrderTable.dueDate} is not null and ${workOrderTable.dueDate} >= current_date and ${workOrderTable.dueDate} < current_date + interval '7 days' and ${workOrderStatusTable.category} <> 'COMPLETED')`.mapWith(
          Number
        ),
      completedLast30dCount:
        sql<number>`count(*) filter (where ${workOrderStatusTable.category} = 'COMPLETED' and ${workOrderTable.completedOn} >= now() - interval '30 days')`.mapWith(
          Number
        ),
    })
    .from(workOrderTable)
    .innerJoin(
      workOrderStatusTable,
      and(
        eq(workOrderStatusTable.id, workOrderTable.statusId),
        eq(workOrderStatusTable.tenantId, workOrderTable.tenantId),
        eq(workOrderStatusTable.isDeleted, false)
      )
    )
    .where(and(eq(workOrderTable.tenantId, tenantId), eq(workOrderTable.isDeleted, false)));

  return summary;
}

async function isTypeInUse(typeId: number, tenantId: string) {
  const [workOrder] = await db
    .select({ id: workOrderTable.id })
    .from(workOrderTable)
    .where(
      and(
        eq(workOrderTable.typeId, typeId),
        eq(workOrderTable.tenantId, tenantId),
        eq(workOrderTable.isDeleted, false)
      )
    )
    .limit(1);
  return Boolean(workOrder);
}

async function isPriorityInUse(priorityId: number, tenantId: string) {
  const [workOrder] = await db
    .select({ id: workOrderTable.id })
    .from(workOrderTable)
    .where(
      and(
        eq(workOrderTable.priorityId, priorityId),
        eq(workOrderTable.tenantId, tenantId),
        eq(workOrderTable.isDeleted, false)
      )
    )
    .limit(1);
  return Boolean(workOrder);
}

async function isStatusInUse(statusId: number, tenantId: string) {
  const [workOrder] = await db
    .select({ id: workOrderTable.id })
    .from(workOrderTable)
    .where(
      and(
        eq(workOrderTable.statusId, statusId),
        eq(workOrderTable.tenantId, tenantId),
        eq(workOrderTable.isDeleted, false)
      )
    )
    .limit(1);
  return Boolean(workOrder);
}

async function hasActiveWorkOrdersForAsset(assetId: number, tenantId: string) {
  const [workOrder] = await db
    .select({ id: workOrderTable.id })
    .from(workOrderTable)
    .innerJoin(
      workOrderStatusTable,
      and(
        eq(workOrderStatusTable.id, workOrderTable.statusId),
        eq(workOrderStatusTable.tenantId, workOrderTable.tenantId),
        eq(workOrderStatusTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(workOrderTable.assetId, assetId),
        eq(workOrderTable.tenantId, tenantId),
        eq(workOrderTable.isDeleted, false),
        ne(workOrderStatusTable.category, 'COMPLETED')
      )
    )
    .limit(1);
  return Boolean(workOrder);
}

export const workOrderRepository = {
  isTypeInUse,
  getWorkOrders,
  isStatusInUse,
  isPriorityInUse,
  createWorkOrder,
  getWorkOrderById,
  getWorkOrderSummary,
  hasActiveWorkOrdersForAsset,
};
