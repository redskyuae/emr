import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { workOrder as workOrderTable } from '@/app/db/schema/work-order';
import { workOrderType as workOrderTypeTable } from '@/app/db/schema/work-order-type';
import type {
  WorkOrderType,
  WorkOrderTypeListParams,
  CreateWorkOrderTypeData,
  UpdateWorkOrderTypeData,
} from '../schemas/work-order-type-schema';

const workOrderTypeColumns = {
  id: workOrderTypeTable.id,
  name: workOrderTypeTable.name,
  code: workOrderTypeTable.code,
  color: workOrderTypeTable.color,
  createdOn: workOrderTypeTable.createdOn,
  tenantId: workOrderTypeTable.tenantId,
  modifiedOn: workOrderTypeTable.modifiedOn,
  description: workOrderTypeTable.description,
};

async function createWorkOrderType(data: CreateWorkOrderTypeData) {
  const [createdWorkOrderType] = await db
    .insert(workOrderTypeTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
    })
    .returning(workOrderTypeColumns);

  return createdWorkOrderType;
}

async function updateWorkOrderType(
  id: number,
  data: UpdateWorkOrderTypeData
): Promise<WorkOrderType | undefined> {
  const [updatedWorkOrderType] = await db
    .update(workOrderTypeTable)
    .set({
      name: data.name,
      code: data.code,
      color: data.color,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(workOrderTypeTable.id, id),
        eq(workOrderTypeTable.tenantId, data.tenantId),
        eq(workOrderTypeTable.isDeleted, false)
      )
    )
    .returning(workOrderTypeColumns);

  return updatedWorkOrderType;
}

async function deleteWorkOrderType(id: number, tenantId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: workOrderTypeTable.id })
      .from(workOrderTypeTable)
      .where(
        and(
          eq(workOrderTypeTable.id, id),
          eq(workOrderTypeTable.tenantId, tenantId),
          eq(workOrderTypeTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) return { outcome: 'not-found' as const };

    const [usage] = await tx
      .select({ id: workOrderTable.id })
      .from(workOrderTable)
      .where(
        and(
          eq(workOrderTable.typeId, id),
          eq(workOrderTable.tenantId, tenantId),
          eq(workOrderTable.isDeleted, false)
        )
      )
      .limit(1);

    if (usage) return { outcome: 'in-use' as const };

    const deletedOn = new Date();
    const [data] = await tx
      .update(workOrderTypeTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(workOrderTypeTable.id, id),
          eq(workOrderTypeTable.tenantId, tenantId),
          eq(workOrderTypeTable.isDeleted, false)
        )
      )
      .returning(workOrderTypeColumns);

    return data ? { outcome: 'deleted' as const, data } : { outcome: 'not-found' as const };
  });
}

async function getWorkOrderTypeById(
  id: number,
  tenantId: string
): Promise<WorkOrderType | undefined> {
  const [workOrderType] = await db
    .select(workOrderTypeColumns)
    .from(workOrderTypeTable)
    .where(
      and(
        eq(workOrderTypeTable.id, id),
        eq(workOrderTypeTable.tenantId, tenantId),
        eq(workOrderTypeTable.isDeleted, false)
      )
    )
    .limit(1);

  return workOrderType;
}

async function getWorkOrderTypes({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: WorkOrderTypeListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(workOrderTypeTable.name, `%${trimmedQuery}%`),
        ilike(workOrderTypeTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(workOrderTypeTable.tenantId, tenantId),
    eq(workOrderTypeTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(workOrderTypeColumns)
      .from(workOrderTypeTable)
      .where(whereClause)
      .orderBy(asc(workOrderTypeTable.name), asc(workOrderTypeTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(workOrderTypeTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<WorkOrderType | undefined> {
  const [workOrderType] = await db
    .select(workOrderTypeColumns)
    .from(workOrderTypeTable)
    .where(
      and(
        eq(workOrderTypeTable.tenantId, tenantId),
        eq(workOrderTypeTable.isDeleted, false),
        sql`lower(${workOrderTypeTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(workOrderTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderType;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<WorkOrderType | undefined> {
  const [workOrderType] = await db
    .select(workOrderTypeColumns)
    .from(workOrderTypeTable)
    .where(
      and(
        eq(workOrderTypeTable.tenantId, tenantId),
        eq(workOrderTypeTable.isDeleted, false),
        sql`lower(${workOrderTypeTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(workOrderTypeTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return workOrderType;
}

type WorkOrderTypeSeed = Omit<CreateWorkOrderTypeData, 'tenantId'>;

async function seedDefaultWorkOrderTypes(tenantId: string, defaults: WorkOrderTypeSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(workOrderTypeTable)
    .values(
      defaults.map((workOrderType) => ({
        tenantId,
        name: workOrderType.name,
        code: workOrderType.code,
        color: workOrderType.color,
        description: workOrderType.description ?? null,
      }))
    )
    .onConflictDoNothing();
}

export const workOrderTypeRepository = {
  findActiveByName,
  findActiveByCode,
  getWorkOrderTypes,
  createWorkOrderType,
  updateWorkOrderType,
  deleteWorkOrderType,
  getWorkOrderTypeById,
  seedDefaultWorkOrderTypes,
};
