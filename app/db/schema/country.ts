import { pgTable, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const countryTable = pgTable('country', {
  id,
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 10 }).notNull(),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});
