import { sql } from 'drizzle-orm';
import { boolean, check, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const visitStatus = pgTable(
  'visit_status',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    code: varchar({ length: 10 }).notNull(),
    category: varchar({
      length: 20,
      enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    }).notNull(),
    color: varchar({ length: 7 }).notNull(),
    description: text(),
    isSystem: boolean('is_system').default(false).notNull(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    categoryCheck: check(
      'visit_status_category_check',
      sql`${table.category} in ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`
    ),
    tenantNameUniqueIdx: uniqueIndex('visit_status_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('visit_status_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
