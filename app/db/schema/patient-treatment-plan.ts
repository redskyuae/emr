import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { appointment as appointmentTable } from './appointment';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from './treatment';
import { visit as visitTable } from './visit';
import { treatmentImportBatch as treatmentImportBatchTable } from './treatment-import';

export const patientTreatmentPlan = pgTable(
  'patient_treatment_plan',
  {
    ...masterColumns(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    treatmentId: integer('treatment_id').references(() => treatmentTable.id),
    treatmentName: text('treatment_name').notNull(),
    treatmentCode: text('treatment_code').notNull(),
    treatmentSourceIdentity: text('treatment_source_identity'),
    sessionStructure: varchar('session_structure', {
      length: 20,
      enum: ['REPEATABLE', 'SEQUENCED'],
    }).notNull(),
    totalSessions: integer('total_sessions').notNull(),
    statusOverride: varchar('status_override', { length: 20, enum: ['STOPPED'] }),
    legacySourceIdentity: text('legacy_source_identity'),
    legacySourceSystem: varchar('legacy_source_system', { length: 100 }),
    legacySourceKey: varchar('legacy_source_key', { length: 64 }),
    legacySourceContentHash: varchar('legacy_source_content_hash', { length: 64 }),
    sourceImportBatchId: integer('source_import_batch_id').references(
      (): AnyPgColumn => treatmentImportBatchTable.id
    ),
    legacyVisitId: text('legacy_visit_id'),
    legacyVisitNumber: text('legacy_visit_number'),
    importBatchId: text('import_batch_id'),
  },
  (table) => ({
    totalSessionsCheck: check(
      'patient_treatment_plan_total_sessions_check',
      sql`${table.totalSessions} > 0`
    ),
    sessionStructureCheck: check(
      'patient_treatment_plan_structure_check',
      sql`${table.sessionStructure} in ('REPEATABLE', 'SEQUENCED')`
    ),
    statusOverrideCheck: check(
      'patient_treatment_plan_status_override_check',
      sql`${table.statusOverride} is null or ${table.statusOverride} = 'STOPPED'`
    ),
    tenantPatientIdx: index('patient_treatment_plan_tenant_patient_idx').on(
      table.tenantId,
      table.patientId
    ),
    tenantTreatmentIdx: index('patient_treatment_plan_tenant_treatment_idx').on(
      table.tenantId,
      table.treatmentId
    ),
    tenantLegacySourceUniqueIdx: uniqueIndex('patient_treatment_plan_tenant_legacy_source_idx')
      .on(table.tenantId, table.legacySourceIdentity)
      .where(sql`${table.legacySourceIdentity} is not null`),
    tenantLegacySourceKeyUniqueIdx: uniqueIndex(
      'patient_treatment_plan_tenant_legacy_source_key_idx'
    )
      .on(table.tenantId, table.legacySourceKey)
      .where(sql`${table.legacySourceKey} is not null`),
    tenantSourceImportBatchIdx: index('patient_treatment_plan_tenant_source_import_batch_idx').on(
      table.tenantId,
      table.sourceImportBatchId
    ),
  })
);

export const patientTreatmentPlanSession = pgTable(
  'patient_treatment_plan_session',
  {
    ...masterColumns(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientTreatmentPlanId: integer('patient_treatment_plan_id')
      .notNull()
      .references(() => patientTreatmentPlan.id),
    treatmentSessionId: integer('treatment_session_id').references(() => treatmentSessionTable.id),
    sessionNumber: integer('session_number').notNull(),
    // These fields are assignment-time snapshots, independent of later template edits.
    label: text(),
    procedure: text(),
    durationMinutes: integer('duration_minutes'),
    setupMinutes: integer('setup_minutes'),
    cleaningMinutes: integer('cleaning_minutes'),
    preparation: text(),
    warning: text(),
    equipment: text(),
    roomType: text('room_type'),
    therapistSkill: text('therapist_skill'),
    legacyConductionNote: text('legacy_conduction_note'),
    completionStatus: varchar('completion_status', { length: 20, enum: ['PENDING', 'COMPLETED'] })
      .notNull()
      .default('PENDING'),
    completionSource: varchar('completion_source', {
      length: 20,
      enum: ['VISIT', 'LEGACY_IMPORT'],
    }),
    completedVisitId: integer('completed_visit_id').references((): AnyPgColumn => visitTable.id),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    sessionNumberCheck: check(
      'patient_treatment_plan_session_number_check',
      sql`${table.sessionNumber} > 0`
    ),
    completionCheck: check(
      'patient_treatment_plan_session_completion_check',
      sql`(
    ${table.completionStatus} = 'PENDING' and ${table.completionSource} is null
    and ${table.completedVisitId} is null and ${table.completedAt} is null
  ) or (
    ${table.completionStatus} = 'COMPLETED' and ${table.completionSource} is not null and (
      (${table.completionSource} = 'VISIT' and ${table.completedVisitId} is not null and ${table.completedAt} is not null)
      or (${table.completionSource} = 'LEGACY_IMPORT' and ${table.completedVisitId} is null)
    )
  )`
    ),
    tenantPlanNumberUniqueIdx: uniqueIndex('patient_treatment_plan_session_tenant_plan_number_idx')
      .on(table.tenantId, table.patientTreatmentPlanId, table.sessionNumber)
      .where(sql`${table.isDeleted} = false`),
    tenantVisitIdx: index('patient_treatment_plan_session_tenant_visit_idx').on(
      table.tenantId,
      table.completedVisitId
    ),
  })
);

export const patientTreatmentPlanSessionReservation = pgTable(
  'patient_treatment_plan_session_reservation',
  {
    ...masterColumns(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientTreatmentPlanSessionId: integer('patient_treatment_plan_session_id')
      .notNull()
      .references(() => patientTreatmentPlanSession.id),
    appointmentId: integer('appointment_id')
      .notNull()
      .references((): AnyPgColumn => appointmentTable.id),
  },
  (table) => ({
    activeSessionUniqueIdx: uniqueIndex('ptp_session_reservation_active_session_idx')
      .on(table.tenantId, table.patientTreatmentPlanSessionId)
      .where(sql`${table.isDeleted} = false`),
    activeAppointmentUniqueIdx: uniqueIndex('ptp_session_reservation_active_appointment_idx')
      .on(table.tenantId, table.appointmentId)
      .where(sql`${table.isDeleted} = false`),
  })
);
