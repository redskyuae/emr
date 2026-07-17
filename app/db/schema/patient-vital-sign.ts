import { sql } from 'drizzle-orm';
import {
  check,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { admission as admissionTable } from './admission';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patientVitalSign = pgTable(
  'patient_vital_sign',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    // Nullable: Vital Signs may be captured during a Visit, an Admission, or standalone.
    visitId: integer('visit_id').references(() => visitTable.id),
    admissionId: integer('admission_id').references(() => admissionTable.id),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    heightCm: doublePrecision('height_cm'),
    weightKg: doublePrecision('weight_kg'),
    bmi: doublePrecision(),
    systolic: integer(),
    diastolic: integer(),
    pulseBpm: integer('pulse_bpm'),
    respRate: integer('resp_rate'),
    temperatureC: doublePrecision('temperature_c'),
    spo2: integer(),
    painScore: integer('pain_score'),
    notes: text(),
    recordedByUserId: varchar('recorded_by_user_id', { length: 255 }).notNull(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    singleClinicalParentCheck: check(
      'patient_vital_sign_single_parent_check',
      sql`not (${table.visitId} is not null and ${table.admissionId} is not null)`
    ),
  })
);
