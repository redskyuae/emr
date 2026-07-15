import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { roomType as roomTypeTable } from './room-type';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const ROOM_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'CLEANING',
] as const;

export const room = pgTable(
  'room',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    roomNumber: varchar('room_number', { length: 20 }).notNull(),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomTypeTable.id),
    status: varchar({ length: 20, enum: ROOM_STATUSES }).notNull().default('AVAILABLE'),
    bedCount: integer('bed_count').notNull().default(1),
    floor: varchar({ length: 20 }),
    wing: varchar({ length: 50 }),
    facility: varchar({ length: 150 }),
    department: varchar({ length: 150 }),
    notes: text(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    statusCheck: check(
      'room_status_check',
      sql`${table.status} in ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING')`
    ),
    bedCountCheck: check('room_bed_count_check', sql`${table.bedCount} > 0`),
    tenantRoomNumberUniqueIdx: uniqueIndex('room_tenant_room_number_idx')
      .on(table.tenantId, sql`lower(${table.roomNumber})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
