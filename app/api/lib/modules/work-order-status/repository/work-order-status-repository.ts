import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { workOrderStatusTable } from '@/app/db/schema/work-order-status';
import type {
  CreateWorkOrderStatusData,
  WorkOrderStatusCategory,
  WorkOrderStatusListParams,
  UpdateWorkOrderStatusData,
} from '../schemas/work-order-status-schema';

const workOrderStatusColumns = {
  id: workOrderStatusTable.id,
  tenantId: workOrderStatusTable.tenantId,
  name: workOrderStatusTable.name,
  code: workOrderStatusTable.code,
  category: workOrderStatusTable.category,
  color: workOrderStatusTable.color,
  description: workOrderStatusTable.description,
  isSystem: workOrderStatusTable.isSystem,
  createdOn: workOrderStatusTable.createdOn,
  modifiedOn: workOrderStatusTable.modifiedOn,
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
  const [updatedWorkOrderStatus] = await db
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

  return updatedWorkOrderStatus;
}

async function softDeleteWorkOrderStatus(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedWorkOrderStatus] = await db
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

  return deletedWorkOrderStatus;
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
  createWorkOrderStatus,
  updateWorkOrderStatus,
  softDeleteWorkOrderStatus,
  getWorkOrderStatusById,
  getWorkOrderStatuses,
  findActiveByName,
  findActiveByCode,
  seedDefaultWorkOrderStatuses,
};
