import { sql } from 'drizzle-orm';
import { boolean, date, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { doctor as doctorTable } from './doctor';
import { doctorRota as doctorRotaTable } from './doctor-rota';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const doctorSchedule = pgTable('doctor_schedule', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctorTable.id),
  slotToDate: date('slot_to_date').notNull(),
  slotFromDate: date('slot_from_date').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});

export const doctorScheduleRota = pgTable(
  'doctor_schedule_rota',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    doctorRotaId: integer('doctor_rota_id')
      .notNull()
      .references(() => doctorRotaTable.id),
    doctorScheduleId: integer('doctor_schedule_id')
      .notNull()
      .references(() => doctorSchedule.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    scheduleRotaUniqueIdx: uniqueIndex('doctor_schedule_rota_active_idx')
      .on(table.doctorScheduleId, table.doctorRotaId)
      .where(sql`${table.isDeleted} = false`),
  })
);
