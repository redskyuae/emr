import { sql } from 'drizzle-orm';
import { integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { country as countryTable } from './country';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const state = pgTable(
  'state',
  {
    id,
    name: varchar({ length: 100 }).notNull(),
    countryId: integer('country_id')
      .notNull()
      .references(() => countryTable.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    nameCountryUniqueIdx: uniqueIndex('state_name_country_idx')
      .on(sql`lower(${table.name})`, table.countryId)
      .where(sql`${table.isDeleted} = false`),
  })
);
