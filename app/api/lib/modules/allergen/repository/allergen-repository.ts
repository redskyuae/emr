import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { allergen as allergenTable } from '@/app/db/schema/allergen';
import type {
  Allergen,
  AllergenCategory,
  AllergenListParams,
  CreateAllergenData,
  UpdateAllergenData,
} from '../schemas/allergen-schema';

const allergenColumns = {
  id: allergenTable.id,
  code: allergenTable.code,
  name: allergenTable.name,
  tenantId: allergenTable.tenantId,
  createdOn: allergenTable.createdOn,
  modifiedOn: allergenTable.modifiedOn,
  category: sql<AllergenCategory>`${allergenTable.category}`.as('category'),
};

async function createAllergen(data: CreateAllergenData) {
  const [createdAllergen] = await db
    .insert(allergenTable)
    .values({
      tenantId: data.tenantId,
      name: data.name,
      code: data.code,
      category: data.category,
    })
    .returning(allergenColumns);

  return createdAllergen;
}

async function updateAllergen(id: number, data: UpdateAllergenData) {
  const [updatedAllergen] = await db
    .update(allergenTable)
    .set({
      name: data.name,
      code: data.code,
      category: data.category,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(allergenTable.id, id),
        eq(allergenTable.tenantId, data.tenantId),
        eq(allergenTable.isDeleted, false)
      )
    )
    .returning(allergenColumns);

  return updatedAllergen;
}

async function deleteAllergen(id: number, tenantId: string): Promise<Allergen | undefined> {
  const deletedOn = new Date();

  const [deletedAllergen] = await db
    .update(allergenTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(
      and(
        eq(allergenTable.id, id),
        eq(allergenTable.tenantId, tenantId),
        eq(allergenTable.isDeleted, false)
      )
    )
    .returning(allergenColumns);

  return deletedAllergen;
}

async function getAllergenById(id: number, tenantId: string): Promise<Allergen | undefined> {
  const [allergen] = await db
    .select(allergenColumns)
    .from(allergenTable)
    .where(
      and(
        eq(allergenTable.id, id),
        eq(allergenTable.tenantId, tenantId),
        eq(allergenTable.isDeleted, false)
      )
    )
    .limit(1);

  return allergen;
}

async function getAllergens({ tenantId, page = 1, limit = 10, query }: AllergenListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(allergenTable.name, `%${trimmedQuery}%`),
        ilike(allergenTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(allergenTable.tenantId, tenantId),
    eq(allergenTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(allergenColumns)
      .from(allergenTable)
      .where(whereClause)
      .orderBy(asc(allergenTable.name), asc(allergenTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(allergenTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Allergen | undefined> {
  const [allergen] = await db
    .select(allergenColumns)
    .from(allergenTable)
    .where(
      and(
        eq(allergenTable.tenantId, tenantId),
        eq(allergenTable.isDeleted, false),
        sql`lower(${allergenTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(allergenTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return allergen;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Allergen | undefined> {
  const [allergen] = await db
    .select(allergenColumns)
    .from(allergenTable)
    .where(
      and(
        eq(allergenTable.tenantId, tenantId),
        eq(allergenTable.isDeleted, false),
        sql`lower(${allergenTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(allergenTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return allergen;
}

type AllergenSeed = Omit<CreateAllergenData, 'tenantId'>;

async function seedDefaultAllergens(tenantId: string, defaults: AllergenSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  await db
    .insert(allergenTable)
    .values(
      defaults.map((allergen) => ({
        tenantId,
        name: allergen.name,
        code: allergen.code,
        category: allergen.category,
      }))
    )
    .onConflictDoNothing();
}

export const allergenRepository = {
  findActiveByName,
  findActiveByCode,
  getAllergens,
  createAllergen,
  updateAllergen,
  deleteAllergen,
  getAllergenById,
  seedDefaultAllergens,
};
