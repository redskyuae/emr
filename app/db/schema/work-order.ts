import { sql } from 'drizzle-orm';
import { date, integer, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { asset as assetTable } from './asset';
import { masterColumns } from './helpers';
import { workOrderPriority as workOrderPriorityTable } from './work-order-priority';
import { workOrderStatus as workOrderStatusTable } from './work-order-status';
import { workOrderType as workOrderTypeTable } from './work-order-type';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const workOrder = pgTable(
  'work_order',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    code: varchar({ length: 20 }).notNull(),
    assetId: integer('asset_id')
      .notNull()
      .references(() => assetTable.id),
    typeId: integer('type_id')
      .notNull()
      .references(() => workOrderTypeTable.id),
    priorityId: integer('priority_id')
      .notNull()
      .references(() => workOrderPriorityTable.id),
    statusId: integer('status_id')
      .notNull()
      .references(() => workOrderStatusTable.id),
    technician: varchar({ length: 150 }),
    dueDate: date('due_date'),
    completedOn: timestamp('completed_on', { withTimezone: true }),
    note: text(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantCodeUniqueIdx: uniqueIndex('work_order_tenant_code_idx').on(
      table.tenantId,
      sql`lower(${table.code})`
    ),
  })
);

export const workOrderCodeCounter = pgTable('work_order_code_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
