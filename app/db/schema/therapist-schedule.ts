import { sql } from 'drizzle-orm';
import { boolean, date, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { doctorRota as doctorRotaTable } from './doctor-rota';
import { masterColumns } from './helpers';
import { therapist as therapistTable } from './therapist';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const therapistSchedule = pgTable('therapist_schedule', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  therapistId: integer('therapist_id')
    .notNull()
    .references(() => therapistTable.id),
  slotToDate: date('slot_to_date').notNull(),
  slotFromDate: date('slot_from_date').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});

export const therapistScheduleRota = pgTable(
  'therapist_schedule_rota',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    doctorRotaId: integer('doctor_rota_id')
      .notNull()
      .references(() => doctorRotaTable.id),
    therapistScheduleId: integer('therapist_schedule_id')
      .notNull()
      .references(() => therapistSchedule.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    scheduleRotaUniqueIdx: uniqueIndex('therapist_schedule_rota_active_idx')
      .on(table.therapistScheduleId, table.doctorRotaId)
      .where(sql`${table.isDeleted} = false`),
  })
);
