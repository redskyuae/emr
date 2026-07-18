import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const CHARGE_ITEM_CATEGORIES = [
  'CONSULTATION',
  'PROCEDURE',
  'INVESTIGATION',
  'BED',
  'CONSUMABLE',
  'OTHER',
] as const;

export const chargeItem = pgTable(
  'charge_item',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    name: varchar({ length: 150 }).notNull(),
    code: varchar({ length: 20 }).notNull(),
    category: varchar({ length: 20, enum: CHARGE_ITEM_CATEGORIES }).notNull().default('OTHER'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    description: text(),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    categoryCheck: check(
      'charge_item_category_check',
      sql`${table.category} in ('CONSULTATION', 'PROCEDURE', 'INVESTIGATION', 'BED', 'CONSUMABLE', 'OTHER')`
    ),
    unitPriceCheck: check('charge_item_unit_price_check', sql`${table.unitPrice} >= 0`),
    tenantNameUniqueIdx: uniqueIndex('charge_item_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('charge_item_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCategoryIdx: index('charge_item_tenant_category_idx').on(table.tenantId, table.category),
  })
);
