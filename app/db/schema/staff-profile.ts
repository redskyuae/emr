import { sql } from 'drizzle-orm';
import { boolean, date, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { organization, user } from './auth';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const staffProfileTable = pgTable(
  'staff_profile',
  {
    id,
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    staffCode: varchar('staff_code', { length: 20 }),
    designation: varchar({ length: 100 }),
    gender: varchar({ length: 20 }),
    dateOfBirth: date('date_of_birth'),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    userTenantUniqueIdx: uniqueIndex('staff_profile_user_tenant_idx').on(
      table.userId,
      table.tenantId
    ),
    userNotDeletedUniqueIdx: uniqueIndex('staff_profile_user_not_deleted_idx')
      .on(table.userId)
      .where(sql`${table.isDeleted} = false`),
    tenantStaffCodeUniqueIdx: uniqueIndex('staff_profile_tenant_staff_code_idx')
      .on(table.tenantId, sql`lower(${table.staffCode})`)
      .where(sql`${table.isDeleted} = false and ${table.staffCode} is not null`),
  })
);
