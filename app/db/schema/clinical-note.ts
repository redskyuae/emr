import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { clinicalNoteType as clinicalNoteTypeTable } from './clinical-note-type';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const clinicalNote = pgTable('clinical_note', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patientTable.id),
  // Nullable, no FK yet: linked to a Visit once Visit management ships.
  visitId: integer('visit_id'),
  noteTypeId: integer('note_type_id')
    .notNull()
    .references(() => clinicalNoteTypeTable.id),
  subjective: text(),
  objective: text(),
  assessment: text(),
  plan: text(),
  status: varchar({ length: 20 }).notNull().default('draft'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  authorUserId: varchar('author_user_id', { length: 255 }).notNull(),
  recordedByUserId: varchar('recorded_by_user_id', { length: 255 }).notNull(),
  isDeleted,
  createdOn,
  modifiedOn,
  deletedOn,
});
