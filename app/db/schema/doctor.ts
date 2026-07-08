import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { organization, user } from './auth';
import { masterColumns } from './helpers';
import { specialty as specialtyTable } from './specialty';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const doctor = pgTable(
  'doctor',
  {
    id,
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    specialtyId: integer('specialty_id')
      .notNull()
      .references(() => specialtyTable.id),
    registrationNumber: varchar('registration_number', { length: 100 }),
    qualifications: text(),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    userNotDeletedUniqueIdx: uniqueIndex('doctor_user_not_deleted_idx')
      .on(table.userId)
      .where(sql`${table.isDeleted} = false`),
    tenantRegistrationUniqueIdx: uniqueIndex('doctor_tenant_registration_number_idx')
      .on(table.tenantId, sql`lower(${table.registrationNumber})`)
      .where(sql`${table.isDeleted} = false AND ${table.registrationNumber} IS NOT NULL`),
  })
);
