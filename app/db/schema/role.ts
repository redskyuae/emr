import { sql } from 'drizzle-orm';
import { boolean, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { organization } from './auth';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const roleTable = pgTable(
  'role',
  {
    id,
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar({ length: 100 }).notNull(),
    code: varchar({ length: 50 }).notNull(),
    description: text(),
    isSystem: boolean('is_system').notNull().default(false),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantNameUniqueIdx: uniqueIndex('role_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('role_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
