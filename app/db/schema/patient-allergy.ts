import { date, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { allergen as allergenTable } from './allergen';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patientAllergy = pgTable('patient_allergy', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patientTable.id),
  allergenId: integer('allergen_id').references(() => allergenTable.id),
  substance: varchar({ length: 150 }),
  reaction: varchar({ length: 255 }),
  severity: varchar({ length: 20 }).notNull(),
  status: varchar({ length: 20 }).notNull().default('active'),
  notedOn: date('noted_on'),
  notes: text(),
  recordedByUserId: varchar('recorded_by_user_id', { length: 255 }).notNull(),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});
