import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { countryTable } from '@/app/db/schema/country';
import type {
  CountryListParams,
  CreateCountryInput,
  UpdateCountryInput,
} from '../schemas/country-schema';

const countryColumns = {
  id: countryTable.id,
  name: countryTable.name,
  code: countryTable.code,
  createdOn: countryTable.createdOn,
  modifiedOn: countryTable.modifiedOn,
};

async function createCountry(data: CreateCountryInput) {
  const [createdCountry] = await db
    .insert(countryTable)
    .values({
      name: data.name,
      code: data.code,
    })
    .returning(countryColumns);

  return createdCountry;
}

async function updateCountry(id: number, data: UpdateCountryInput) {
  const [updatedCountry] = await db
    .update(countryTable)
    .set({
      name: data.name,
      code: data.code,
      modifiedOn: new Date(),
    })
    .where(and(eq(countryTable.id, id), eq(countryTable.isDeleted, false)))
    .returning(countryColumns);

  return updatedCountry;
}

async function deleteCountry(id: number) {
  const deletedOn = new Date();

  const [deletedCountry] = await db
    .update(countryTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(and(eq(countryTable.id, id), eq(countryTable.isDeleted, false)))
    .returning(countryColumns);

  return deletedCountry;
}

async function getCountryById(id: number) {
  const [country] = await db
    .select(countryColumns)
    .from(countryTable)
    .where(and(eq(countryTable.id, id), eq(countryTable.isDeleted, false)))
    .limit(1);

  return country;
}

async function getCountries({ page = 1, limit = 10, query }: CountryListParams = {}) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(countryTable.name, `%${trimmedQuery}%`),
        ilike(countryTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(eq(countryTable.isDeleted, false), searchCondition);

  const [data, [{ total }]] = await Promise.all([
    db
      .select(countryColumns)
      .from(countryTable)
      .where(whereClause)
      .orderBy(asc(countryTable.name), asc(countryTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(countryTable).where(whereClause),
  ]);

  return { data, total };
}

async function findActiveByName(name: string, { excludeId }: { excludeId?: number } = {}) {
  const [country] = await db
    .select(countryColumns)
    .from(countryTable)
    .where(
      and(
        eq(countryTable.isDeleted, false),
        sql`lower(${countryTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(countryTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return country;
}

async function findActiveByCode(code: string, { excludeId }: { excludeId?: number } = {}) {
  const [country] = await db
    .select(countryColumns)
    .from(countryTable)
    .where(
      and(
        eq(countryTable.isDeleted, false),
        sql`lower(${countryTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(countryTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return country;
}

export const countryRepository = {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getCountryById,
  findActiveByName,
  findActiveByCode,
};
