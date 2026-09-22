import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { therapistSkill } from './therapist-skill';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const treatment = pgTable(
  'treatment',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    code: varchar({ length: 20 }).notNull(),
    description: text(),
    durationMinutes: integer('duration_minutes').notNull(),
    setupMinutes: integer('setup_minutes').notNull().default(0),
    cleaningMinutes: integer('cleaning_minutes').notNull().default(0),
    roomType: varchar('room_type', { length: 100 }),
    therapistSkill: varchar('therapist_skill', { length: 100 }),
    therapistSkillId: integer('therapist_skill_id').references(() => therapistSkill.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantNameUniqueIdx: uniqueIndex('treatment_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('treatment_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
    tenantIdx: index('treatment_tenant_idx').on(table.tenantId),
  })
);

export const treatmentSession = pgTable(
  'treatment_session',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    treatmentId: integer('treatment_id')
      .notNull()
      .references(() => treatment.id),
    sessionNumber: integer('session_number').notNull(),
    label: varchar({ length: 200 }).notNull(),
    procedure: varchar({ length: 200 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    setupMinutes: integer('setup_minutes').notNull().default(0),
    cleaningMinutes: integer('cleaning_minutes').notNull().default(0),
    preparation: text(),
    warning: text(),
    equipment: text(),
    roomType: varchar('room_type', { length: 100 }),
    therapistSkill: varchar('therapist_skill', { length: 100 }),
    therapistSkillId: integer('therapist_skill_id').references(() => therapistSkill.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantTreatmentSessionUniqueIdx: uniqueIndex('treatment_session_tenant_treatment_number_idx')
      .on(table.tenantId, table.treatmentId, table.sessionNumber)
      .where(sql`${table.isDeleted} = false`),
    treatmentIdx: index('treatment_session_treatment_idx').on(table.treatmentId),
  })
);
