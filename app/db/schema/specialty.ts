import { sql } from 'drizzle-orm';
import { pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const specialty = pgTable(
  'specialty',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    code: varchar({ length: 10 }),
    description: text(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantNameUniqueIdx: uniqueIndex('specialty_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('specialty_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false AND ${table.code} IS NOT NULL`),
  })
);
