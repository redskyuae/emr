import { sql } from 'drizzle-orm';
import { date, integer, numeric, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { assetCategoryTable } from './asset-category';
import { assetConditionTable } from './asset-condition';
import { assetStatusTable } from './asset-status';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const assetTable = pgTable(
  'asset',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 150 }).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => assetCategoryTable.id),
    statusId: integer('status_id')
      .notNull()
      .references(() => assetStatusTable.id),
    conditionId: integer('condition_id').references(() => assetConditionTable.id),
    manufacturer: varchar({ length: 150 }),
    model: varchar({ length: 150 }),
    serialNumber: varchar('serial_number', { length: 100 }).notNull(),
    facility: varchar({ length: 150 }),
    department: varchar({ length: 150 }),
    location: varchar({ length: 200 }),
    custodian: varchar({ length: 150 }),
    purchaseDate: date('purchase_date'),
    warrantyExpiry: date('warranty_expiry'),
    cost: numeric({ precision: 14, scale: 2, mode: 'number' }),
    currentValue: numeric('current_value', { precision: 14, scale: 2, mode: 'number' }),
    lastServiceDate: date('last_service_date'),
    nextServiceDate: date('next_service_date'),
    calibrationDate: date('calibration_date'),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantSerialUniqueIdx: uniqueIndex('asset_tenant_serial_idx')
      .on(table.tenantId, sql`lower(${table.serialNumber})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
