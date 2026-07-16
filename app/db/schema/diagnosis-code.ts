import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const diagnosisCode = pgTable(
  'diagnosis_code',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    code: varchar({ length: 10 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 100 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantCodeUniqueIdx: uniqueIndex('diagnosis_code_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
