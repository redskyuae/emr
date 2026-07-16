import { doublePrecision, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patientVitalSign = pgTable('patient_vital_sign', {
  id,
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patientTable.id),
  // Nullable, no FK yet: linked to a Visit once Visit management ships.
  visitId: integer('visit_id'),
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
});
