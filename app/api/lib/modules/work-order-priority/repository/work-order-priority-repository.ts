import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { workOrderPriorityTable } from '@/app/db/schema/work-order-priority';
import type {
  CreateWorkOrderPriorityData,
  UpdateWorkOrderPriorityData,
  WorkOrderPriorityListParams,
} from '../schemas/work-order-priority-schema';

const workOrderPriorityColumns = {
  id: workOrderPriorityTable.id,
  tenantId: workOrderPriorityTable.tenantId,
  name: workOrderPriorityTable.name,
  code: workOrderPriorityTable.code,
  color: workOrderPriorityTable.color,
  description: workOrderPriorityTable.description,
  createdOn: workOrderPriorityTable.createdOn,
  modifiedOn: workOrderPriorityTable.modifiedOn,
};

async function createWorkOrderPriority(data: CreateWorkOrderPriorityData) {
  const [createdWorkOrderPriority] = await db
    .insert(workOrderPriorityTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
    })
    .returning(workOrderPriorityColumns);

  return createdWorkOrderPriority;
}

async function updateWorkOrderPriority(id: number, data: UpdateWorkOrderPriorityData) {
  const [updatedWorkOrderPriority] = await db
    .update(workOrderPriorityTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(workOrderPriorityTable.id, id),
        eq(workOrderPriorityTable.tenantId, data.tenantId),
        eq(workOrderPriorityTable.isDeleted, false)
      )
    )
    .returning(workOrderPriorityColumns);

  return updatedWorkOrderPriority;
}

async function softDeleteWorkOrderPriority(id: number, tenantId: string) {
  const deletedOn = new Date();

  const [deletedWorkOrderPriority] = await db
    .update(workOrderPriorityTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(workOrderPriorityTable.id, id),
        eq(workOrderPriorityTable.tenantId, tenantId),
        eq(workOrderPriorityTable.isDeleted, false)
      )
    )
    .returning(workOrderPriorityColumns);

  return deletedWorkOrderPriority;
}

async function getWorkOrderPriorityById(id: number, tenantId: string) {
  const [workOrderPriority] = await db
    .select(workOrderPriorityColumns)
    .from(workOrderPriorityTable)
    .where(
      and(
        eq(workOrderPriorityTable.id, id),
        eq(workOrderPriorityTable.tenantId, tenantId),
        eq(workOrderPriorityTable.isDeleted, false)
      )
    )
    .limit(1);

  return workOrderPriority;
}

async function getWorkOrderPriorities({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: WorkOrderPriorityListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(workOrderPriorityTable.name, `%${trimmedQuery}%`),
        ilike(workOrderPriorityTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(workOrderPriorityTable.tenantId, tenantId),
    eq(workOrderPriorityTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(workOrderPriorityColumns)
      .from(workOrderPriorityTable)
      .where(whereClause)
      .orderBy(asc(workOrderPriorityTable.name), asc(workOrderPriorityTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(workOrderPriorityTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [workOrderPriority] = await db
    .select(workOrderPriorityColumns)
    .from(workOrderPriorityTable)
    .where(
      and(
        eq(workOrderPriorityTable.tenantId, tenantId),
        eq(workOrderPriorityTable.isDeleted, false),
        sql`lower(${workOrderPriorityTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(workOrderPriorityTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderPriority;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [workOrderPriority] = await db
    .select(workOrderPriorityColumns)
    .from(workOrderPriorityTable)
    .where(
      and(
        eq(workOrderPriorityTable.tenantId, tenantId),
        eq(workOrderPriorityTable.isDeleted, false),
        sql`lower(${workOrderPriorityTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(workOrderPriorityTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderPriority;
}

type WorkOrderPrioritySeed = Omit<CreateWorkOrderPriorityData, 'tenantId'>;

async function seedDefaultWorkOrderPriorities(
  tenantId: string,
  defaults: WorkOrderPrioritySeed[]
) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(workOrderPriorityTable)
    .values(
      defaults.map((workOrderPriority) => ({
        tenantId,
        name: workOrderPriority.name,
        code: workOrderPriority.code,
        color: workOrderPriority.color,
        description: workOrderPriority.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const workOrderPriorityRepository = {
  createWorkOrderPriority,
  updateWorkOrderPriority,
  softDeleteWorkOrderPriority,
  getWorkOrderPriorityById,
  getWorkOrderPriorities,
  findActiveByName,
  findActiveByCode,
  seedDefaultWorkOrderPriorities,
};
