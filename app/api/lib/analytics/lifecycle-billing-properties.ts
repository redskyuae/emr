// Properties of the Billing lifecycle events. Counts, flags, statuses and durations only: never an
// amount, a Discount value, an Invoice or Receipt Number, or what a line was charged for.

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { minutesBetween } from './lifecycle-durations';

type InvoiceLink = AnalyticsEventProperties<'invoice_created'>['linked_to'];

/** What the Invoice bills: a Visit, an Admission, or neither. */
export function invoiceLink(invoice: Pick<Invoice, 'visit' | 'admission'>): InvoiceLink {
  if (invoice.visit) return 'visit';
  if (invoice.admission) return 'admission';
  return 'none';
}

/** `invoice_finalized`. */
export function invoiceFinalizedProperties(
  invoice: Invoice
): AnalyticsEventProperties<'invoice_finalized'> {
  return {
    linked_to: invoiceLink(invoice),
    line_count: invoice.lines.length,
    manual_line_count: invoice.lines.filter((line) => line.source === 'MANUAL').length,
    bed_auto_line_count: invoice.lines.filter((line) => line.source === 'BED_AUTO').length,
    has_discount: invoice.discountAmount > 0,
    resulting_status: invoice.status,
    minutes_since_created: minutesBetween(
      invoice.createdOn,
      invoice.finalizedAt ?? invoice.createdOn
    ),
  };
}

/**
 * `invoice_voided`. Only a Draft or a Finalized Invoice with nothing paid can be voided, so the
 * status it left is read from whether it had been finalized.
 */
export function invoiceVoidedProperties(
  invoice: Pick<Invoice, 'finalizedAt'>
): AnalyticsEventProperties<'invoice_voided'> {
  return { from_status: invoice.finalizedAt ? 'FINALIZED' : 'DRAFT' };
}

/** `payment_recorded`. `payment_sequence` is 1 for the Invoice's first Payment. */
export function paymentRecordedProperties(
  invoice: Invoice,
  payment: Pick<Payment, 'method' | 'receivedAt'>,
  visitCheckedInAt: Date | null | undefined
): AnalyticsEventProperties<'payment_recorded'> {
  return {
    payment_method: payment.method,
    resulting_invoice_status: invoice.status,
    payment_sequence: invoice.payments.length,
    linked_to: invoiceLink(invoice),
    minutes_since_visit_check_in: visitCheckedInAt
      ? minutesBetween(visitCheckedInAt, payment.receivedAt)
      : undefined,
  };
}
