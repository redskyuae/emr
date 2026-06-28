import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { languageTable } from '@/app/db/schema/language';
import type {
  CreateLanguageInput,
  LanguageListParams,
  UpdateLanguageInput,
} from '../schemas/language-schema';

const languageColumns = {
  id: languageTable.id,
  name: languageTable.name,
  code: languageTable.code,
  createdOn: languageTable.createdOn,
  modifiedOn: languageTable.modifiedOn,
};

async function createLanguage(data: CreateLanguageInput) {
  const [createdLanguage] = await db
    .insert(languageTable)
    .values({
      name: data.name,
      code: data.code,
    })
    .returning(languageColumns);

  return createdLanguage;
}

async function updateLanguage(id: number, data: UpdateLanguageInput) {
  const [updatedLanguage] = await db
    .update(languageTable)
    .set({
      name: data.name,
      code: data.code,
      modifiedOn: new Date(),
    })
    .where(and(eq(languageTable.id, id), eq(languageTable.isDeleted, false)))
    .returning(languageColumns);

  return updatedLanguage;
}

async function deleteLanguage(id: number) {
  const deletedOn = new Date();

  const [deletedLanguage] = await db
    .update(languageTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(and(eq(languageTable.id, id), eq(languageTable.isDeleted, false)))
    .returning(languageColumns);

  return deletedLanguage;
}

async function getLanguageById(id: number) {
  const [language] = await db
    .select(languageColumns)
    .from(languageTable)
    .where(and(eq(languageTable.id, id), eq(languageTable.isDeleted, false)))
    .limit(1);

  return language;
}

async function getLanguages({ page = 1, limit = 10, query }: LanguageListParams = {}) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(languageTable.name, `%${trimmedQuery}%`),
        ilike(languageTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(eq(languageTable.isDeleted, false), searchCondition);

  const [data, [{ total }]] = await Promise.all([
    db
      .select(languageColumns)
      .from(languageTable)
      .where(whereClause)
      .orderBy(asc(languageTable.name), asc(languageTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(languageTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(name: string, { excludeId }: { excludeId?: number } = {}) {
  const [language] = await db
    .select(languageColumns)
    .from(languageTable)
    .where(
      and(
        eq(languageTable.isDeleted, false),
        sql`lower(${languageTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(languageTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return language;
}

async function findActiveByCode(code: string, { excludeId }: { excludeId?: number } = {}) {
  const [language] = await db
    .select(languageColumns)
    .from(languageTable)
    .where(
      and(
        eq(languageTable.isDeleted, false),
        sql`lower(${languageTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(languageTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return language;
}

export const languageRepository = {
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getLanguageById,
  findActiveByName,
  findActiveByCode,
};
