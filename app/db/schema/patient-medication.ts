import { date, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patientMedication = pgTable('patient_medication', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patientTable.id),
  drugName: varchar('drug_name', { length: 200 }).notNull(),
  dose: varchar({ length: 100 }),
  route: varchar({ length: 50 }),
  frequency: varchar({ length: 100 }),
  status: varchar({ length: 20 }).notNull().default('active'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  notes: text(),
  recordedByUserId: varchar('recorded_by_user_id', { length: 255 }).notNull(),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});
