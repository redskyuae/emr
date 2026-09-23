import { and, asc, count, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { therapistSkill as therapistSkillTable } from '@/app/db/schema/therapist-skill';
import type {
  CreateTherapistSkillData,
  TherapistSkillListParams,
  UpdateTherapistSkillData,
} from '../schemas/therapist-skill-schema';

const therapistSkillColumns = {
  id: therapistSkillTable.id,
  tenantId: therapistSkillTable.tenantId,
  name: therapistSkillTable.name,
  code: therapistSkillTable.code,
  description: therapistSkillTable.description,
  createdOn: therapistSkillTable.createdOn,
  modifiedOn: therapistSkillTable.modifiedOn,
};

function normalizePagination(page = 1, limit = 10) {
  return {
    page: Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1,
    limit: Number.isFinite(limit) ? Math.min(999, Math.max(1, Math.floor(limit))) : 10,
  };
}

async function getTherapistSkillById(id: number, tenantId: string) {
  const [skill] = await db
    .select(therapistSkillColumns)
    .from(therapistSkillTable)
    .where(
      and(
        eq(therapistSkillTable.id, id),
        eq(therapistSkillTable.tenantId, tenantId),
        eq(therapistSkillTable.isDeleted, false)
      )
    )
    .limit(1);

  return skill;
}

async function getTherapistSkills({
  tenantId,
  page = 1,
  limit = 10,
  query,
}: TherapistSkillListParams) {
  const pagination = normalizePagination(page, limit);
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(therapistSkillTable.name, `%${trimmedQuery}%`),
        ilike(therapistSkillTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(therapistSkillTable.tenantId, tenantId),
    eq(therapistSkillTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(therapistSkillColumns)
      .from(therapistSkillTable)
      .where(whereClause)
      .orderBy(asc(therapistSkillTable.name), asc(therapistSkillTable.id))
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit),
    db.select({ total: count() }).from(therapistSkillTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [skill] = await db
    .select(therapistSkillColumns)
    .from(therapistSkillTable)
    .where(
      and(
        eq(therapistSkillTable.tenantId, tenantId),
        eq(therapistSkillTable.isDeleted, false),
        sql`lower(${therapistSkillTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(therapistSkillTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return skill;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [skill] = await db
    .select(therapistSkillColumns)
    .from(therapistSkillTable)
    .where(
      and(
        eq(therapistSkillTable.tenantId, tenantId),
        eq(therapistSkillTable.isDeleted, false),
        sql`lower(${therapistSkillTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(therapistSkillTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return skill;
}

async function createTherapistSkill(data: CreateTherapistSkillData) {
  const [skill] = await db
    .insert(therapistSkillTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
    })
    .returning(therapistSkillColumns);

  return skill;
}

async function updateTherapistSkill(id: number, data: UpdateTherapistSkillData) {
  const [skill] = await db
    .update(therapistSkillTable)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(therapistSkillTable.id, id),
        eq(therapistSkillTable.tenantId, data.tenantId),
        eq(therapistSkillTable.isDeleted, false)
      )
    )
    .returning(therapistSkillColumns);

  return skill;
}

async function deleteTherapistSkill(id: number, tenantId: string) {
  const deletedOn = new Date();
  const [skill] = await db
    .update(therapistSkillTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(therapistSkillTable.id, id),
        eq(therapistSkillTable.tenantId, tenantId),
        eq(therapistSkillTable.isDeleted, false)
      )
    )
    .returning(therapistSkillColumns);

  return skill;
}

async function getActiveSkillsByIds(ids: number[], tenantId: string) {
  if (ids.length === 0) return [];
  return db
    .select(therapistSkillColumns)
    .from(therapistSkillTable)
    .where(
      and(
        eq(therapistSkillTable.tenantId, tenantId),
        eq(therapistSkillTable.isDeleted, false),
        inArray(therapistSkillTable.id, ids)
      )
    );
}

export const therapistSkillRepository = {
  getTherapistSkillById,
  getTherapistSkills,
  findActiveByName,
  findActiveByCode,
  createTherapistSkill,
  updateTherapistSkill,
  deleteTherapistSkill,
  getActiveSkillsByIds,
};
