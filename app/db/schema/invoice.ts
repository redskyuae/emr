import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { admission as admissionTable } from './admission';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const INVOICE_STATUSES = ['DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'VOID'] as const;

export const invoice = pgTable(
  'invoice',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    invoiceNumber: varchar('invoice_number', { length: 20 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    visitId: integer('visit_id').references(() => visitTable.id),
    admissionId: integer('admission_id').references(() => admissionTable.id),
    status: varchar({ length: 20, enum: INVOICE_STATUSES }).notNull().default('DRAFT'),
    subtotal: numeric('subtotal', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2, mode: 'number' })
      .notNull()
      .default(0),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2, mode: 'number' })
      .notNull()
      .default(0),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2, mode: 'number' })
      .notNull()
      .default(0),
    notes: text(),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: varchar('void_reason', { length: 255 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    statusCheck: check(
      'invoice_status_check',
      sql`${table.status} in ('DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'VOID')`
    ),
    // At most one encounter parent: an Invoice is raised for a Visit or an
    // Admission, never both (decision 7).
    singleParentCheck: check(
      'invoice_single_parent_check',
      sql`not (${table.visitId} is not null and ${table.admissionId} is not null)`
    ),
    discountCheck: check(
      'invoice_discount_check',
      sql`${table.discountAmount} >= 0 and ${table.discountAmount} <= ${table.subtotal}`
    ),
    amountPaidCheck: check(
      'invoice_amount_paid_check',
      sql`${table.amountPaid} >= 0 and ${table.amountPaid} <= ${table.grandTotal}`
    ),
    tenantNumberUniqueIdx: uniqueIndex('invoice_tenant_number_idx').on(
      table.tenantId,
      sql`lower(${table.invoiceNumber})`
    ),
    tenantStatusIdx: index('invoice_tenant_status_idx').on(table.tenantId, table.status),
    tenantPatientIdx: index('invoice_tenant_patient_idx').on(table.tenantId, table.patientId),
  })
);

export const invoiceNumberCounter = pgTable('invoice_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});

export const receiptNumberCounter = pgTable('receipt_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
