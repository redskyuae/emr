import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { organization } from './auth';
import { permission as permissionTable } from './permission';
import { role as roleTable } from './role';

export const rolePermission = pgTable(
  'role_permission',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    roleId: integer('role_id')
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissionTable.id, { onDelete: 'cascade' }),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdOn: timestamp('created_on', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('role_permission_tenant_idx').on(table.tenantId),
    rolePermissionUniqueIdx: uniqueIndex('role_permission_role_id_permission_id_idx').on(
      table.roleId,
      table.permissionId
    ),
  })
);
