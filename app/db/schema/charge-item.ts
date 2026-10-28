import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
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

export const VISIT_CHARGE_KINDS = [
  'NEW_CONSULTATION',
  'ESTABLISHED_CONSULTATION',
  'FOLLOW_UP_CONSULTATION',
  'TREATMENT_SESSION',
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
    cashPrice: numeric('cash_price', { precision: 12, scale: 2, mode: 'number' }),
    insuranceContractPrice: numeric('insurance_contract_price', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }),
    freeFollowUpEligible: boolean('free_follow_up_eligible').notNull().default(false),
    effectiveDate: date('effective_date', { mode: 'string' }),
    visitChargeKind: varchar('visit_charge_kind', { length: 32, enum: VISIT_CHARGE_KINDS }),
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
    cashPriceCheck: check('charge_item_cash_price_check', sql`${table.cashPrice} >= 0`),
    insuranceContractPriceCheck: check(
      'charge_item_insurance_contract_price_check',
      sql`${table.insuranceContractPrice} >= 0`
    ),
    visitChargeKindCheck: check(
      'charge_item_visit_charge_kind_check',
      sql`${table.visitChargeKind} in ('NEW_CONSULTATION', 'ESTABLISHED_CONSULTATION', 'FOLLOW_UP_CONSULTATION', 'TREATMENT_SESSION')`
    ),
    tenantNameUniqueIdx: uniqueIndex('charge_item_tenant_name_idx')
      .on(table.tenantId, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCodeUniqueIdx: uniqueIndex('charge_item_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
    tenantCategoryIdx: index('charge_item_tenant_category_idx').on(table.tenantId, table.category),
  })
);
