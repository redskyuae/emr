import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { admissionType as admissionTypeTable } from './admission-type';
import { bed as bedTable } from './bed';
import { doctor as doctorTable } from './doctor';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const admission = pgTable(
  'admission',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    admissionNumber: varchar('admission_number', { length: 20 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    doctorId: integer('doctor_id')
      .notNull()
      .references(() => doctorTable.id),
    admissionTypeId: integer('admission_type_id')
      .notNull()
      .references(() => admissionTypeTable.id),
    bedId: integer('bed_id')
      .notNull()
      .references(() => bedTable.id),
    visitId: integer('visit_id').references(() => visitTable.id),
    status: varchar({ length: 20 }).notNull().default('ADMITTED'),
    admissionReason: varchar('admission_reason', { length: 500 }),
    remarks: text(),
    expectedDischargeDate: date('expected_discharge_date'),
    admittedAt: timestamp('admitted_at', { withTimezone: true }).notNull().defaultNow(),
    dischargedAt: timestamp('discharged_at', { withTimezone: true }),
    dischargeDisposition: varchar('discharge_disposition', { length: 20 }),
    dischargeSummary: text('discharge_summary'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: varchar('cancellation_reason', { length: 255 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    statusCheck: check(
      'admission_status_check',
      sql`${table.status} in ('ADMITTED', 'DISCHARGED', 'CANCELLED')`
    ),
    dispositionCheck: check(
      'admission_discharge_disposition_check',
      sql`${table.dischargeDisposition} is null or ${table.dischargeDisposition} in ('ROUTINE', 'LAMA', 'TRANSFERRED', 'DECEASED', 'ABSCONDED')`
    ),
    tenantAdmissionNumberUniqueIdx: uniqueIndex('admission_tenant_number_idx').on(
      table.tenantId,
      sql`lower(${table.admissionNumber})`
    ),
    // A Patient has at most one Active Admission; discharge or cancel frees them (ADR 0034).
    activePatientUniqueIdx: uniqueIndex('admission_active_patient_idx')
      .on(table.tenantId, table.patientId)
      .where(sql`${table.isDeleted} = false and ${table.status} = 'ADMITTED'`),
    // A Bed hosts at most one Active Admission — the occupancy race backstop (ADR 0034).
    activeBedUniqueIdx: uniqueIndex('admission_active_bed_idx')
      .on(table.tenantId, table.bedId)
      .where(sql`${table.isDeleted} = false and ${table.status} = 'ADMITTED'`),
    tenantStatusIdx: index('admission_tenant_status_idx').on(table.tenantId, table.status),
  })
);

export const admissionNumberCounter = pgTable('admission_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
