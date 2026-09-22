import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { organization } from './auth';
import { therapistSkill as therapistSkillTable } from './therapist-skill';
import { therapist as therapistTable } from './therapist';

export const therapistSkillAssignment = pgTable(
  'therapist_skill_assignment',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    therapistId: integer('therapist_id')
      .notNull()
      .references(() => therapistTable.id, { onDelete: 'cascade' }),
    therapistSkillId: integer('therapist_skill_id')
      .notNull()
      .references(() => therapistSkillTable.id, { onDelete: 'cascade' }),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('therapist_skill_assignment_tenant_idx').on(table.tenantId),
    therapistIdx: index('therapist_skill_assignment_therapist_idx').on(table.therapistId),
    uniqueAssignmentIdx: uniqueIndex('therapist_skill_assignment_unique_idx').on(
      table.therapistId,
      table.therapistSkillId,
      table.tenantId
    ),
  })
);
