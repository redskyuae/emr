import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { admission as admissionTable } from './admission';
import { clinicalNoteType as clinicalNoteTypeTable } from './clinical-note-type';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const clinicalNote = pgTable(
  'clinical_note',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    // Nullable: Clinical Notes may be authored during a Visit, an Admission, or standalone.
    visitId: integer('visit_id').references(() => visitTable.id),
    admissionId: integer('admission_id').references(() => admissionTable.id),
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
  },
  (table) => ({
    singleClinicalParentCheck: check(
      'clinical_note_single_parent_check',
      sql`not (${table.visitId} is not null and ${table.admissionId} is not null)`
    ),
  })
);
