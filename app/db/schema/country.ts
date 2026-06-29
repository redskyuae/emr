import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const country = pgTable(
  'country',
  {
    id,
    name: varchar({ length: 100 }).notNull(),
    code: varchar({ length: 10 }).notNull(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('country_name_idx')
      .on(sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    codeUniqueIdx: uniqueIndex('country_code_idx')
      .on(sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
