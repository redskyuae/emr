import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { appointmentReason as appointmentReasonTable } from './appointment-reason';
import { appointmentType as appointmentTypeTable } from './appointment-type';
import { doctor as doctorTable } from './doctor';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visitStatus as visitStatusTable } from './visit-status';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const visit = pgTable(
  'visit',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    visitNumber: varchar('visit_number', { length: 20 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    doctorId: integer('doctor_id').references(() => doctorTable.id),
    appointmentTypeId: integer('appointment_type_id')
      .notNull()
      .references(() => appointmentTypeTable.id),
    appointmentReasonId: integer('appointment_reason_id').references(
      () => appointmentReasonTable.id
    ),
    statusId: integer('status_id')
      .notNull()
      .references(() => visitStatusTable.id),
    chiefComplaint: text('chief_complaint'),
    notes: text(),
    cancelledReason: text('cancelled_reason'),
    startedOn: timestamp('started_on', { withTimezone: true }),
    completedOn: timestamp('completed_on', { withTimezone: true }),
    cancelledOn: timestamp('cancelled_on', { withTimezone: true }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantVisitNumberUniqueIdx: uniqueIndex('visit_tenant_visit_number_idx').on(
      table.tenantId,
      sql`lower(${table.visitNumber})`
    ),
  })
);

export const visitNumberCounter = pgTable('visit_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
