import { z } from 'zod';

import { INVOICE_LINE_SOURCES } from '@/app/db/schema/invoice-line';
import { INVOICE_STATUSES } from '@/app/db/schema/invoice';
import { PAYMENT_METHODS } from '@/app/db/schema/payment';

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type InvoiceLineSource = (typeof INVOICE_LINE_SOURCES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Every money column is numeric(12,2): 10 integer digits + 2 decimal digits.
// quantity and unitPrice are each schema-bounded individually, but their
// product (the line amount) is not — a large-but-valid quantity times a
// large-but-valid price can still exceed this and raise a raw Postgres
// numeric-overflow error instead of a clean validation error.
export const MAX_MONEY_AMOUNT = 9_999_999_999.99;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

const optionalPositiveIdSchema = (fieldName: string) =>
  z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    positiveIdSchema(fieldName).optional()
  );

const optionalTrimmedText = (max: number, fieldName: string) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} must be at most ${max} characters`)
    .optional()
    .nullable()
    .transform((value) => (value === null || value === '' ? undefined : value));

const moneyAmountSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .nonnegative(`${fieldName} must be zero or more`)
    .max(9_999_999_999, `${fieldName} is too large`)
    .transform(roundMoney);

export const invoiceIdSchema = positiveIdSchema('Invoice ID');
export const invoiceLineIdSchema = positiveIdSchema('Invoice line ID');
export const invoiceTenantIdSchema = tenantIdSchema;

export const invoiceStatusFilterSchema = z.enum(INVOICE_STATUSES).optional();

export const createInvoiceSchema = z
  .object({
    patientId: positiveIdSchema('Patient ID'),
    visitId: optionalPositiveIdSchema('Visit ID'),
    admissionId: optionalPositiveIdSchema('Admission ID'),
    notes: optionalTrimmedText(2000, 'Notes'),
  })
  .refine((data) => !(data.visitId !== undefined && data.admissionId !== undefined), {
    message: 'An Invoice can link to a Visit or an Admission, not both.',
    path: ['admissionId'],
  });

export const addInvoiceLineSchema = z.object({
  chargeItemId: positiveIdSchema('Charge item ID'),
  quantity: z.coerce
    .number({ error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100_000, 'Quantity is too large'),
  unitPrice: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    moneyAmountSchema('Unit price').optional()
  ),
});

export const updateDraftInvoiceSchema = z.object({
  discountAmount: moneyAmountSchema('Discount').default(0),
  notes: optionalTrimmedText(2000, 'Notes'),
});

export const voidInvoiceSchema = z.object({
  voidReason: z
    .string({ error: 'Void reason is required' })
    .trim()
    .min(1, 'Void reason cannot be empty')
    .max(255, 'Void reason must be at most 255 characters'),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce
    .number({ error: 'Payment amount is required' })
    .positive('Payment amount must be greater than zero')
    .max(9_999_999_999, 'Payment amount is too large')
    .transform(roundMoney)
    // A sub-cent amount (e.g. 0.001) passes .positive() before rounding, then
    // rounds to 0 — re-check post-transform so it fails validation cleanly
    // instead of tripping the DB's payment_amount_check as an uncaught 500.
    .refine((value) => value > 0, { error: 'Payment amount must be greater than zero' }),
  method: z.enum(PAYMENT_METHODS, {
    error: `Payment method must be one of ${PAYMENT_METHODS.join(', ')}`,
  }),
  reference: optionalTrimmedText(100, 'Payment reference'),
  notes: optionalTrimmedText(255, 'Payment notes'),
  receivedAt: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value, context) => {
      if (value === null || value === undefined || value === '') {
        return undefined;
      }

      const parsed = new Date(value);

      if (Number.isNaN(parsed.getTime())) {
        context.addIssue({ code: 'custom', message: 'Received date is invalid' });
        return z.NEVER;
      }

      if (parsed.getTime() > Date.now() + 60_000) {
        context.addIssue({ code: 'custom', message: 'Received date cannot be in the future' });
        return z.NEVER;
      }

      return parsed;
    }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type AddInvoiceLineInput = z.infer<typeof addInvoiceLineSchema>;
export type UpdateDraftInvoiceInput = z.infer<typeof updateDraftInvoiceSchema>;
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export type CreateInvoiceData = CreateInvoiceInput & { tenantId: string };

export type InvoiceLine = {
  id: number;
  invoiceId: number;
  chargeItemId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  source: InvoiceLineSource;
};

export type Payment = {
  id: number;
  invoiceId: number;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  receivedAt: Date;
};

export type InvoicePatientSummary = {
  id: number;
  mrn: string;
  firstName: string;
  lastName: string;
};

export type InvoiceVisitSummary = {
  id: number;
  visitNumber: string;
};

export type InvoiceAdmissionSummary = {
  id: number;
  admissionNumber: string;
};

export type Invoice = {
  id: number;
  tenantId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  finalizedAt: Date | null;
  voidedAt: Date | null;
  voidReason: string | null;
  createdOn: Date;
  modifiedOn: Date;
  patient: InvoicePatientSummary;
  visit: InvoiceVisitSummary | null;
  admission: InvoiceAdmissionSummary | null;
  lines: InvoiceLine[];
  payments: Payment[];
};

export type InvoiceListItem = {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  createdOn: Date;
  patient: InvoicePatientSummary;
  visit: InvoiceVisitSummary | null;
  admission: InvoiceAdmissionSummary | null;
};

export type InvoiceListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  patientId?: number;
  statuses?: InvoiceStatus[];
};
