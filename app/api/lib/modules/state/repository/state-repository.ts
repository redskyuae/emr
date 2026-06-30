import { and, asc, count, eq, ilike, ne, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { country as countryTable } from '@/app/db/schema/country';
import { state as stateTable } from '@/app/db/schema/state';
import type {
  CreateStateInput,
  State,
  StateListParams,
  UpdateStateInput,
} from '../schemas/state-schema';

const stateColumns = {
  id: stateTable.id,
  name: stateTable.name,
  countryId: stateTable.countryId,
  createdOn: stateTable.createdOn,
  modifiedOn: stateTable.modifiedOn,
};

const countryColumns = {
  id: countryTable.id,
  name: countryTable.name,
  code: countryTable.code,
};

type StateRow = {
  state: Omit<State, 'country'>;
  country: State['country'];
};

function toState(row: StateRow): State {
  return {
    ...row.state,
    country: row.country,
  };
}

async function createState(data: CreateStateInput) {
  const [createdState] = await db
    .insert(stateTable)
    .values({
      name: data.name,
      countryId: data.countryId,
    })
    .returning(stateColumns);

  if (!createdState) {
    return undefined;
  }

  return getStateById(createdState.id);
}

async function updateState(id: number, data: UpdateStateInput) {
  const [updatedState] = await db
    .update(stateTable)
    .set({
      name: data.name,
      countryId: data.countryId,
      modifiedOn: new Date(),
    })
    .where(and(eq(stateTable.id, id), eq(stateTable.isDeleted, false)))
    .returning(stateColumns);

  if (!updatedState) {
    return undefined;
  }

  return getStateById(updatedState.id);
}

async function deleteState(id: number) {
  const existingState = await getStateById(id);

  if (!existingState) {
    return undefined;
  }

  const deletedOn = new Date();

  const [deletedState] = await db
    .update(stateTable)
    .set({
      isDeleted: true,
      modifiedOn: deletedOn,
      deletedOn,
    })
    .where(and(eq(stateTable.id, id), eq(stateTable.isDeleted, false)))
    .returning(stateColumns);

  if (!deletedState) {
    return undefined;
  }

  return existingState;
}

async function getStateById(id: number) {
  const [state] = await db
    .select({
      state: stateColumns,
      country: countryColumns,
    })
    .from(stateTable)
    .innerJoin(
      countryTable,
      and(eq(stateTable.countryId, countryTable.id), eq(countryTable.isDeleted, false))
    )
    .where(and(eq(stateTable.id, id), eq(stateTable.isDeleted, false)))
    .limit(1);

  return state ? toState(state) : undefined;
}

async function getStates({ page = 1, limit = 10, query, countryId }: StateListParams = {}) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const whereClause = and(
    eq(stateTable.isDeleted, false),
    eq(countryTable.isDeleted, false),
    trimmedQuery ? ilike(stateTable.name, `%${trimmedQuery}%`) : undefined,
    countryId !== undefined ? eq(stateTable.countryId, countryId) : undefined
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        state: stateColumns,
        country: countryColumns,
      })
      .from(stateTable)
      .innerJoin(countryTable, eq(stateTable.countryId, countryTable.id))
      .where(whereClause)
      .orderBy(asc(countryTable.name), asc(stateTable.name), asc(stateTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(stateTable)
      .innerJoin(countryTable, eq(stateTable.countryId, countryTable.id))
      .where(whereClause),
  ]);

  return { data: data.map(toState), total };
}

async function findActiveByNameAndCountry(
  name: string,
  countryId: number,
  { excludeId }: { excludeId?: number } = {}
): Promise<Pick<State, 'id' | 'name' | 'countryId' | 'createdOn' | 'modifiedOn'> | undefined> {
  const [state] = await db
    .select(stateColumns)
    .from(stateTable)
    .where(
      and(
        eq(stateTable.isDeleted, false),
        eq(stateTable.countryId, countryId),
        sql`lower(${stateTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(stateTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return state;
}

export const stateRepository = {
  getStates,
  createState,
  updateState,
  deleteState,
  getStateById,
  findActiveByNameAndCountry,
};
