import { date, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { diagnosisCode as diagnosisCodeTable } from './diagnosis-code';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patientProblem = pgTable('patient_problem', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patientTable.id),
  diagnosisCodeId: integer('diagnosis_code_id').references(() => diagnosisCodeTable.id),
  title: varchar({ length: 255 }).notNull(),
  clinicalStatus: varchar('clinical_status', { length: 20 }).notNull().default('active'),
  onsetDate: date('onset_date'),
  resolvedDate: date('resolved_date'),
  notes: text(),
  recordedByUserId: varchar('recorded_by_user_id', { length: 255 }).notNull(),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});
