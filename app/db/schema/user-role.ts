import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { organization, user } from './auth';
import { role as roleTable } from './role';

export const userRole = pgTable(
  'user_role',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    assignedBy: text('assigned_by')
      .notNull()
      .references(() => user.id),
    assignedOn: timestamp('assigned_on', { withTimezone: true }).notNull().defaultNow(),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('user_role_tenant_idx').on(table.tenantId),
    userTenantIdx: index('user_role_user_tenant_idx').on(table.userId, table.tenantId),
    roleTenantIdx: index('user_role_role_tenant_idx').on(table.roleId, table.tenantId),
    userRoleTenantUniqueIdx: uniqueIndex('user_role_user_id_role_id_tenant_id_idx').on(
      table.userId,
      table.roleId,
      table.tenantId
    ),
  })
);
