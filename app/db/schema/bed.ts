import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { room as roomTable } from './room';
import { ward as wardTable } from './ward';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] as const;

export const bed = pgTable(
  'bed',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    bedNumber: varchar('bed_number', { length: 20 }).notNull(),
    wardId: integer('ward_id')
      .notNull()
      .references(() => wardTable.id),
    roomId: integer('room_id').references(() => roomTable.id),
    status: varchar({ length: 20, enum: BED_STATUSES }).notNull().default('AVAILABLE'),
    notes: text(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    statusCheck: check(
      'bed_status_check',
      sql`${table.status} in ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')`
    ),
    wardBedNumberUniqueIdx: uniqueIndex('bed_ward_bed_number_idx')
      .on(table.tenantId, table.wardId, sql`lower(${table.bedNumber})`)
      .where(sql`${table.isDeleted} = false`),
    tenantStatusIdx: index('bed_tenant_status_idx').on(table.tenantId, table.status),
    tenantWardIdx: index('bed_tenant_ward_idx').on(table.tenantId, table.wardId),
  })
);
