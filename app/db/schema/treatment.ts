import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const treatment = pgTable(
  'treatment',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    code: varchar({ length: 20 }).notNull(),
    description: text(),
    sessionStructure: varchar('session_structure', {
      length: 20,
      enum: ['REPEATABLE', 'SEQUENCED'],
    })
      .notNull()
      .default('SEQUENCED'),
    defaultTotalSessions: integer('default_total_sessions'),
    legacySourceIdentity: text('legacy_source_identity'),
    legacySourceSystem: varchar('legacy_source_system', { length: 100 }),
    durationMinutes: integer('duration_minutes'),
    setupMinutes: integer('setup_minutes'),
    cleaningMinutes: integer('cleaning_minutes'),
    roomType: varchar('room_type', { length: 100 }),
    therapistSkill: varchar('therapist_skill', { length: 100 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    sessionStructureCheck: check(
      'treatment_session_structure_check',
      sql`${table.sessionStructure} in ('REPEATABLE', 'SEQUENCED')`
    ),
    defaultTotalSessionsCheck: check(
      'treatment_default_total_sessions_check',
      sql`${table.defaultTotalSessions} is null or (${table.sessionStructure} = 'REPEATABLE' and ${table.defaultTotalSessions} > 0)`
    ),
    tenantNameUniqueIdx: uniqueIndex('treatment_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false and ${table.legacySourceIdentity} is null`),
    tenantCodeUniqueIdx: uniqueIndex('treatment_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false and ${table.legacySourceIdentity} is null`),
    tenantLegacySourceUniqueIdx: uniqueIndex('treatment_tenant_legacy_source_idx')
      .on(table.tenantId, sql`lower(${table.legacySourceIdentity})`)
      .where(sql`${table.isDeleted} = false and ${table.legacySourceIdentity} is not null`),
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
    durationMinutes: integer('duration_minutes'),
    setupMinutes: integer('setup_minutes'),
    cleaningMinutes: integer('cleaning_minutes'),
    preparation: text(),
    warning: text(),
    equipment: text(),
    roomType: varchar('room_type', { length: 100 }),
    therapistSkill: varchar('therapist_skill', { length: 100 }),
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
