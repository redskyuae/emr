import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { invoice as invoiceTable } from './invoice';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'] as const;

export const payment = pgTable(
  'payment',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    receiptNumber: varchar('receipt_number', { length: 20 }).notNull(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoiceTable.id),
    amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    method: varchar({ length: 20, enum: PAYMENT_METHODS }).notNull(),
    reference: varchar({ length: 100 }),
    notes: varchar({ length: 255 }),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    amountCheck: check('payment_amount_check', sql`${table.amount} > 0`),
    methodCheck: check(
      'payment_method_check',
      sql`${table.method} in ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')`
    ),
    tenantReceiptUniqueIdx: uniqueIndex('payment_tenant_receipt_idx').on(
      table.tenantId,
      sql`lower(${table.receiptNumber})`
    ),
    tenantInvoiceIdx: index('payment_tenant_invoice_idx').on(table.tenantId, table.invoiceId),
  })
);
