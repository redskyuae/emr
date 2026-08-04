import { sql } from 'drizzle-orm';
import { boolean, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const doctorRota = pgTable(
  'doctor_rota',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    toTime: varchar('to_time', { length: 5 }).notNull(),
    fromTime: varchar('from_time', { length: 5 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantNameUniqueIdx: uniqueIndex('doctor_rota_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantTimeRangeUniqueIdx: uniqueIndex('doctor_rota_tenant_time_range_idx')
      .on(table.tenantId, table.fromTime, table.toTime)
      .where(sql`${table.isDeleted} = false`),
  })
);
