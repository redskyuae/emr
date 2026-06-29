import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const religion = pgTable(
  'religion',
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
    nameUniqueIdx: uniqueIndex('religion_name_idx')
      .on(sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    codeUniqueIdx: uniqueIndex('religion_code_idx')
      .on(sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
