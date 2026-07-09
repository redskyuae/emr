import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitStatus as visitStatusTable } from '@/app/db/schema/visit-status';
import type {
  VisitStatus,
  CreateVisitStatusData,
  VisitStatusCategory,
  VisitStatusListParams,
  UpdateVisitStatusData,
} from '../schemas/visit-status-schema';

const visitStatusColumns = {
  id: visitStatusTable.id,
  name: visitStatusTable.name,
  code: visitStatusTable.code,
  color: visitStatusTable.color,
  tenantId: visitStatusTable.tenantId,
  isSystem: visitStatusTable.isSystem,
  category: visitStatusTable.category,
  createdOn: visitStatusTable.createdOn,
  modifiedOn: visitStatusTable.modifiedOn,
  description: visitStatusTable.description,
};

async function createVisitStatus(data: CreateVisitStatusData) {
  const [createdVisitStatus] = await db
    .insert(visitStatusTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      category: data.category,
      color: data.color,
      description: data.description ?? null,
      isSystem: false,
    })
    .returning(visitStatusColumns);

  return createdVisitStatus;
}

async function updateVisitStatus(id: number, data: UpdateVisitStatusData) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: visitStatusTable.id, category: visitStatusTable.category })
      .from(visitStatusTable)
      .where(
        and(
          eq(visitStatusTable.id, id),
          eq(visitStatusTable.tenantId, data.tenantId),
          eq(visitStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) return { outcome: 'not-found' as const };

    if (existing.category !== data.category) {
      const [usage] = await tx
        .select({ id: visitTable.id })
        .from(visitTable)
        .where(
          and(
            eq(visitTable.statusId, id),
            eq(visitTable.tenantId, data.tenantId),
            eq(visitTable.isDeleted, false)
          )
        )
        .limit(1);

      if (usage) return { outcome: 'in-use' as const };
    }

    const [updated] = await tx
      .update(visitStatusTable)
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
          eq(visitStatusTable.id, id),
          eq(visitStatusTable.tenantId, data.tenantId),
          eq(visitStatusTable.isDeleted, false)
        )
      )
      .returning(visitStatusColumns);

    return updated ? { outcome: 'updated' as const, data: updated } : { outcome: 'not-found' as const };
  });
}

async function deleteVisitStatus(id: number, tenantId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: visitStatusTable.id, isSystem: visitStatusTable.isSystem })
      .from(visitStatusTable)
      .where(
        and(
          eq(visitStatusTable.id, id),
          eq(visitStatusTable.tenantId, tenantId),
          eq(visitStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing || existing.isSystem) return { outcome: 'not-found' as const };

    const [usage] = await tx
      .select({ id: visitTable.id })
      .from(visitTable)
      .where(
        and(
          eq(visitTable.statusId, id),
          eq(visitTable.tenantId, tenantId),
          eq(visitTable.isDeleted, false)
        )
      )
      .limit(1);

    if (usage) return { outcome: 'in-use' as const };

    const deletedOn = new Date();
    const [deleted] = await tx
      .update(visitStatusTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(visitStatusTable.id, id),
          eq(visitStatusTable.tenantId, tenantId),
          eq(visitStatusTable.isDeleted, false),
          eq(visitStatusTable.isSystem, false)
        )
      )
      .returning(visitStatusColumns);

    return deleted ? { outcome: 'deleted' as const, data: deleted } : { outcome: 'not-found' as const };
  });
}

async function getVisitStatusById(id: number, tenantId: string): Promise<VisitStatus | undefined> {
  const [visitStatus] = await db
    .select(visitStatusColumns)
    .from(visitStatusTable)
    .where(
      and(
        eq(visitStatusTable.id, id),
        eq(visitStatusTable.tenantId, tenantId),
        eq(visitStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  return visitStatus;
}

async function getSystemVisitStatusByCategory(
  tenantId: string,
  category: VisitStatusCategory
): Promise<VisitStatus | undefined> {
  const [visitStatus] = await db
    .select(visitStatusColumns)
    .from(visitStatusTable)
    .where(
      and(
        eq(visitStatusTable.tenantId, tenantId),
        eq(visitStatusTable.category, category),
        eq(visitStatusTable.isSystem, true),
        eq(visitStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  return visitStatus;
}

async function getVisitStatuses({ tenantId, page = 1, limit = 10, query }: VisitStatusListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(visitStatusTable.name, `%${trimmedQuery}%`),
        ilike(visitStatusTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(visitStatusTable.tenantId, tenantId),
    eq(visitStatusTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(visitStatusColumns)
      .from(visitStatusTable)
      .where(whereClause)
      .orderBy(asc(visitStatusTable.name), asc(visitStatusTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(visitStatusTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<VisitStatus | undefined> {
  const [visitStatus] = await db
    .select(visitStatusColumns)
    .from(visitStatusTable)
    .where(
      and(
        eq(visitStatusTable.tenantId, tenantId),
        eq(visitStatusTable.isDeleted, false),
        sql`lower(${visitStatusTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(visitStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return visitStatus;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<VisitStatus | undefined> {
  const [visitStatus] = await db
    .select(visitStatusColumns)
    .from(visitStatusTable)
    .where(
      and(
        eq(visitStatusTable.tenantId, tenantId),
        eq(visitStatusTable.isDeleted, false),
        sql`lower(${visitStatusTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(visitStatusTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return visitStatus;
}

type VisitStatusSeed = {
  name: string;
  code: string;
  category: VisitStatusCategory;
  color: string;
  description?: string;
  isSystem?: boolean;
};

async function seedDefaultVisitStatuses(tenantId: string, defaults: VisitStatusSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(visitStatusTable)
    .values(
      defaults.map((visitStatus) => ({
        tenantId,
        name: visitStatus.name,
        code: visitStatus.code,
        category: visitStatus.category,
        color: visitStatus.color,
        description: visitStatus.description ?? null,
        isSystem: visitStatus.isSystem ?? false,
      }))
    )
    .onConflictDoNothing();
}

export const visitStatusRepository = {
  findActiveByName,
  findActiveByCode,
  getVisitStatuses,
  getVisitStatusById,
  createVisitStatus,
  updateVisitStatus,
  deleteVisitStatus,
  seedDefaultVisitStatuses,
  getSystemVisitStatusByCategory,
};
