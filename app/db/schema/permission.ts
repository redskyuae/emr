import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const permission = pgTable(
  'permission',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    module: varchar({ length: 50 }).notNull(),
    resource: varchar({ length: 50 }).notNull(),
    action: varchar({ length: 20 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    isActive: boolean('is_active').notNull().default(true),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
    modifiedOn: timestamp('modified_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('permission_name_idx').on(table.name),
  })
);
