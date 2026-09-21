import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  patientTreatmentPlan as patientTreatmentPlanTable,
  patientTreatmentPlanSession as patientTreatmentPlanSessionTable,
} from './patient-treatment-plan';
import { treatment as treatmentTable } from './treatment';

export const TREATMENT_IMPORT_SOURCE_SYSTEMS = ['DHATHRI'] as const;
export const TREATMENT_IMPORT_BATCH_STATUSES = [
  'RUNNING',
  'COMPLETED',
  'COMPLETED_WITH_QUARANTINE',
  'FAILED',
] as const;
export const TREATMENT_IMPORT_ROW_OUTCOMES = ['IMPORTED', 'SKIPPED', 'QUARANTINED'] as const;

export type TreatmentImportRowReason = {
  code: string;
  description: string;
};

export const treatmentImportBatch = pgTable(
  'treatment_import_batch',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    sourceSystem: varchar('source_system', {
      length: 50,
      enum: TREATMENT_IMPORT_SOURCE_SYSTEMS,
    })
      .notNull()
      .default('DHATHRI'),
    originalFilename: text('original_filename').notNull(),
    workbookSha256: varchar('workbook_sha256', { length: 64 }).notNull(),
    status: varchar({ length: 40, enum: TREATMENT_IMPORT_BATCH_STATUSES })
      .notNull()
      .default('RUNNING'),
    importedRowCount: integer('imported_row_count').notNull().default(0),
    skippedRowCount: integer('skipped_row_count').notNull().default(0),
    quarantinedRowCount: integer('quarantined_row_count').notNull().default(0),
    importedPlanCount: integer('imported_plan_count').notNull().default(0),
    skippedPlanCount: integer('skipped_plan_count').notNull().default(0),
    quarantinedPlanCount: integer('quarantined_plan_count').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    failureSummary: text('failure_summary'),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
    modifiedOn: timestamp('modified_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceSystemCheck: check(
      'treatment_import_batch_source_system_check',
      sql`${table.sourceSystem} = 'DHATHRI'`
    ),
    statusCheck: check(
      'treatment_import_batch_status_check',
      sql`${table.status} in ('RUNNING', 'COMPLETED', 'COMPLETED_WITH_QUARANTINE', 'FAILED')`
    ),
    workbookHashCheck: check(
      'treatment_import_batch_workbook_hash_check',
      sql`char_length(${table.workbookSha256}) = 64`
    ),
    nonnegativeCountsCheck: check(
      'treatment_import_batch_nonnegative_counts_check',
      sql`${table.importedRowCount} >= 0
        and ${table.skippedRowCount} >= 0
        and ${table.quarantinedRowCount} >= 0
        and ${table.importedPlanCount} >= 0
        and ${table.skippedPlanCount} >= 0
        and ${table.quarantinedPlanCount} >= 0`
    ),
    tenantStatusIdx: index('treatment_import_batch_tenant_status_idx').on(
      table.tenantId,
      table.status
    ),
    tenantSourceWorkbookUniqueIdx: uniqueIndex(
      'treatment_import_batch_tenant_source_workbook_idx'
    ).on(table.tenantId, table.sourceSystem, table.workbookSha256),
  })
);

export const treatmentImportRow = pgTable(
  'treatment_import_row',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    batchId: integer('batch_id')
      .notNull()
      .references(() => treatmentImportBatch.id),
    sheetName: text('sheet_name').notNull(),
    sourceRowNumber: integer('source_row_number').notNull(),
    rowSha256: varchar('row_sha256', { length: 64 }).notNull(),
    rawTreatment: text('raw_treatment'),
    rawTotalSession: text('raw_total_session'),
    rawMrn: text('raw_mrn'),
    rawVisitId: text('raw_visit_id'),
    rawVisitNumber: text('raw_visit_number'),
    rawTreatmentStatus: text('raw_treatment_status'),
    rawSessionNumber: text('raw_session_number'),
    rawConductionNote: text('raw_conduction_note'),
    rawSessionStatus: text('raw_session_status'),
    legacyTreatmentIdentity: text('legacy_treatment_identity'),
    legacyPlanKey: varchar('legacy_plan_key', { length: 64 }),
    outcome: varchar({ length: 20, enum: TREATMENT_IMPORT_ROW_OUTCOMES }).notNull(),
    reasons: jsonb()
      .$type<TreatmentImportRowReason[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    canonicalTreatmentId: integer('canonical_treatment_id').references(() => treatmentTable.id),
    canonicalPatientTreatmentPlanId: integer('canonical_patient_treatment_plan_id').references(
      (): AnyPgColumn => patientTreatmentPlanTable.id
    ),
    canonicalPatientTreatmentPlanSessionId: integer(
      'canonical_patient_treatment_plan_session_id'
    ).references((): AnyPgColumn => patientTreatmentPlanSessionTable.id),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
    modifiedOn: timestamp('modified_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceRowNumberCheck: check(
      'treatment_import_row_source_row_number_check',
      sql`${table.sourceRowNumber} > 0`
    ),
    rowHashCheck: check(
      'treatment_import_row_hash_check',
      sql`char_length(${table.rowSha256}) = 64`
    ),
    legacyPlanKeyCheck: check(
      'treatment_import_row_legacy_plan_key_check',
      sql`${table.legacyPlanKey} is null or char_length(${table.legacyPlanKey}) = 64`
    ),
    outcomeCheck: check(
      'treatment_import_row_outcome_check',
      sql`${table.outcome} in ('IMPORTED', 'SKIPPED', 'QUARANTINED')`
    ),
    tenantBatchIdx: index('treatment_import_row_tenant_batch_idx').on(
      table.tenantId,
      table.batchId
    ),
    tenantLegacyPlanIdx: index('treatment_import_row_tenant_legacy_plan_idx').on(
      table.tenantId,
      table.legacyPlanKey
    ),
    tenantOutcomeIdx: index('treatment_import_row_tenant_outcome_idx').on(
      table.tenantId,
      table.outcome
    ),
    batchSheetNumberUniqueIdx: uniqueIndex('treatment_import_row_batch_sheet_number_idx').on(
      table.batchId,
      table.sheetName,
      table.sourceRowNumber
    ),
  })
);
