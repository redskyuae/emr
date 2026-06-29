import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { workOrder as workOrderTable } from '@/app/db/schema/work-order';
import { workOrderStatus as workOrderStatusTable } from '@/app/db/schema/work-order-status';
import type {
  CreateWorkOrderStatusData,
  WorkOrderStatusCategory,
  WorkOrderStatusListParams,
  UpdateWorkOrderStatusData,
} from '../schemas/work-order-status-schema';

const workOrderStatusColumns = {
  id: workOrderStatusTable.id,
  name: workOrderStatusTable.name,
  code: workOrderStatusTable.code,
  color: workOrderStatusTable.color,
  tenantId: workOrderStatusTable.tenantId,
  isSystem: workOrderStatusTable.isSystem,
  category: workOrderStatusTable.category,
  createdOn: workOrderStatusTable.createdOn,
  modifiedOn: workOrderStatusTable.modifiedOn,
  description: workOrderStatusTable.description,
};

async function createWorkOrderStatus(data: CreateWorkOrderStatusData) {
  const [createdWorkOrderStatus] = await db
    .insert(workOrderStatusTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      category: data.category,
      color: data.color,
      description: data.description ?? null,
      isSystem: false,
    })
    .returning(workOrderStatusColumns);

  return createdWorkOrderStatus;
}

async function updateWorkOrderStatus(id: number, data: UpdateWorkOrderStatusData) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: workOrderStatusTable.id, category: workOrderStatusTable.category })
      .from(workOrderStatusTable)
      .where(
        and(
          eq(workOrderStatusTable.id, id),
          eq(workOrderStatusTable.tenantId, data.tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) return { outcome: 'not-found' as const };

    if (existing.category !== data.category) {
      const [usage] = await tx
        .select({ id: workOrderTable.id })
        .from(workOrderTable)
        .where(
          and(
            eq(workOrderTable.statusId, id),
            eq(workOrderTable.tenantId, data.tenantId),
            eq(workOrderTable.isDeleted, false)
          )
        )
        .limit(1);

      if (usage) return { outcome: 'in-use' as const };
    }

    const [updated] = await tx
      .update(workOrderStatusTable)
      .set({
        name: data.name,
        code: data.code,
        category: data.category,
        color: data.color,
        description: data.description ?? null,
        modifiedOn: new Date(),
      })
      .where(
        and(
          eq(workOrderStatusTable.id, id),
          eq(workOrderStatusTable.tenantId, data.tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .returning(workOrderStatusColumns);

    return updated
      ? { outcome: 'updated' as const, data: updated }
      : { outcome: 'not-found' as const };
  });
}

async function deleteWorkOrderStatus(id: number, tenantId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: workOrderStatusTable.id, isSystem: workOrderStatusTable.isSystem })
      .from(workOrderStatusTable)
      .where(
        and(
          eq(workOrderStatusTable.id, id),
          eq(workOrderStatusTable.tenantId, tenantId),
          eq(workOrderStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing || existing.isSystem) return { outcome: 'not-found' as const };

    const [usage] = await tx
      .select({ id: workOrderTable.id })
      .from(workOrderTable)
      .where(
        and(
          eq(workOrderTable.statusId, id),
          eq(workOrderTable.tenantId, tenantId),
          eq(workOrderTable.isDeleted, false)
        )
      )
      .limit(1);

    if (usage) return { outcome: 'in-use' as const };

    const deletedOn = new Date();
    const [deleted] = await tx
      .update(workOrderStatusTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(workOrderStatusTable.id, id),
          eq(workOrderStatusTable.tenantId, tenantId),
          eq(workOrderStatusTable.isDeleted, false),
          eq(workOrderStatusTable.isSystem, false)
        )
      )
      .returning(workOrderStatusColumns);

    return deleted
      ? { outcome: 'deleted' as const, data: deleted }
      : { outcome: 'not-found' as const };
  });
}

async function getWorkOrderStatusById(id: number, tenantId: string) {
  const [workOrderStatus] = await db
    .select(workOrderStatusColumns)
    .from(workOrderStatusTable)
    .where(
      and(
        eq(workOrderStatusTable.id, id),
        eq(workOrderStatusTable.tenantId, tenantId),
        eq(workOrderStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  return workOrderStatus;
}

async function getWorkOrderStatuses({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: WorkOrderStatusListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(workOrderStatusTable.name, `%${trimmedQuery}%`),
        ilike(workOrderStatusTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(workOrderStatusTable.tenantId, tenantId),
    eq(workOrderStatusTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(workOrderStatusColumns)
      .from(workOrderStatusTable)
      .where(whereClause)
      .orderBy(asc(workOrderStatusTable.name), asc(workOrderStatusTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(workOrderStatusTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [workOrderStatus] = await db
    .select(workOrderStatusColumns)
    .from(workOrderStatusTable)
    .where(
      and(
        eq(workOrderStatusTable.tenantId, tenantId),
        eq(workOrderStatusTable.isDeleted, false),
        sql`lower(${workOrderStatusTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(workOrderStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderStatus;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [workOrderStatus] = await db
    .select(workOrderStatusColumns)
    .from(workOrderStatusTable)
    .where(
      and(
        eq(workOrderStatusTable.tenantId, tenantId),
        eq(workOrderStatusTable.isDeleted, false),
        sql`lower(${workOrderStatusTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(workOrderStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderStatus;
}

type WorkOrderStatusSeed = {
  name: string;
  code: string;
  category: WorkOrderStatusCategory;
  color: string;
  description?: string;
  isSystem?: boolean;
};

async function seedDefaultWorkOrderStatuses(tenantId: string, defaults: WorkOrderStatusSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(workOrderStatusTable)
    .values(
      defaults.map((workOrderStatus) => ({
        tenantId,
        name: workOrderStatus.name,
        code: workOrderStatus.code,
        category: workOrderStatus.category,
        color: workOrderStatus.color,
        description: workOrderStatus.description ?? null,
        isSystem: workOrderStatus.isSystem ?? false,
      }))
    )
    .onConflictDoNothing();
}

export const workOrderStatusRepository = {
  findActiveByName,
  findActiveByCode,
  getWorkOrderStatuses,
  getWorkOrderStatusById,
  createWorkOrderStatus,
  updateWorkOrderStatus,
  deleteWorkOrderStatus,
  seedDefaultWorkOrderStatuses,
};
