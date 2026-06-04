import { boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export function masterColumns() {
  return {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
    modifiedOn: timestamp('modified_on', { withTimezone: true }).notNull().defaultNow(),
    deletedOn: timestamp('deleted_on', { withTimezone: true }),
  };
}
