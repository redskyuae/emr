import { sql } from 'drizzle-orm';
import { check, index, integer, numeric, pgTable, varchar } from 'drizzle-orm/pg-core';

import { chargeItem as chargeItemTable } from './charge-item';
import { masterColumns } from './helpers';
import { invoice as invoiceTable } from './invoice';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const INVOICE_LINE_SOURCES = ['MANUAL', 'BED_AUTO'] as const;

export const invoiceLine = pgTable(
  'invoice_line',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoiceTable.id),
    chargeItemId: integer('charge_item_id').references(() => chargeItemTable.id),
    description: varchar({ length: 255 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    source: varchar({ length: 10, enum: INVOICE_LINE_SOURCES }).notNull().default('MANUAL'),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    quantityCheck: check('invoice_line_quantity_check', sql`${table.quantity} >= 1`),
    unitPriceCheck: check('invoice_line_unit_price_check', sql`${table.unitPrice} >= 0`),
    sourceCheck: check('invoice_line_source_check', sql`${table.source} in ('MANUAL', 'BED_AUTO')`),
    tenantInvoiceIdx: index('invoice_line_tenant_invoice_idx').on(table.tenantId, table.invoiceId),
  })
);
