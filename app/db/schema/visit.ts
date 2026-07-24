import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { appointment as appointmentTable } from './appointment';
import { doctor as doctorTable } from './doctor';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visitType as visitTypeTable } from './visit-type';

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
    doctorId: integer('doctor_id')
      .notNull()
      .references(() => doctorTable.id),
    visitTypeId: integer('visit_type_id')
      .notNull()
      .references(() => visitTypeTable.id),
    appointmentId: integer('appointment_id').references(() => appointmentTable.id),
    status: varchar({ length: 20 }).notNull().default('CHECKED_IN'),
    visitDate: date('visit_date').notNull(),
    queueToken: integer('queue_token').notNull(),
    chiefComplaint: varchar('chief_complaint', { length: 500 }),
    remarks: text(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }).notNull().defaultNow(),
    consultationStartedAt: timestamp('consultation_started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: varchar('cancellation_reason', { length: 255 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    statusCheck: check(
      'visit_status_check',
      sql`${table.status} in ('CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED')`
    ),
    tenantVisitNumberUniqueIdx: uniqueIndex('visit_tenant_visit_number_idx').on(
      table.tenantId,
      sql`lower(${table.visitNumber})`
    ),
    // One Appointment yields at most one non-cancelled Visit, so a cancelled
    // Check-in can be redone against the same Appointment (ADR 0031).
    activeAppointmentUniqueIdx: uniqueIndex('visit_active_appointment_idx')
      .on(table.tenantId, table.appointmentId)
      .where(
        sql`${table.isDeleted} = false and ${table.appointmentId} is not null and ${table.status} <> 'CANCELLED'`
      ),
    // A Patient has at most one Active Visit; completing or cancelling frees them (ADR 0031).
    activePatientUniqueIdx: uniqueIndex('visit_active_patient_idx')
      .on(table.tenantId, table.patientId)
      .where(
        sql`${table.isDeleted} = false and ${table.status} in ('CHECKED_IN', 'IN_CONSULTATION')`
      ),
    doctorDayTokenUniqueIdx: uniqueIndex('visit_doctor_day_token_idx')
      .on(table.tenantId, table.doctorId, table.visitDate, table.queueToken)
      .where(sql`${table.isDeleted} = false`),
    tenantVisitDateIdx: index('visit_tenant_visit_date_idx').on(table.tenantId, table.visitDate),
    tenantPatientIdx: index('visit_tenant_patient_idx').on(table.tenantId, table.patientId),
  })
);

export const visitNumberCounter = pgTable('visit_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});

export const visitQueueTokenCounter = pgTable(
  'visit_queue_token_counter',
  {
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    doctorId: integer('doctor_id').notNull(),
    tokenDate: date('token_date').notNull(),
    lastNumber: integer('last_number').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.doctorId, table.tokenDate] }),
  })
);
