import { describe, expect, it } from 'vitest';

import type {
  Invoice,
  InvoiceLine,
  Payment,
} from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import {
  invoiceFinalizedProperties,
  invoiceLink,
  invoiceVoidedProperties,
  paymentRecordedProperties,
} from './lifecycle-billing-properties';

const createdOn = new Date('2026-11-21T06:00:00Z');

function line(source: InvoiceLine['source']): InvoiceLine {
  return {
    id: 1,
    invoiceId: 15,
    chargeItemId: null,
    description: 'Consultation fee',
    quantity: 1,
    unitPrice: 250,
    amount: 250,
    source,
  };
}

function payment(receivedAt: Date): Payment {
  return {
    id: 2,
    invoiceId: 15,
    receiptNumber: 'RCPT-0002',
    amount: 100,
    method: 'CARD',
    reference: null,
    notes: null,
    receivedAt,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 15,
    tenantId: 'tenant-1',
    invoiceNumber: 'INV-2026-0015',
    status: 'DRAFT',
    subtotal: 500,
    discountAmount: 0,
    grandTotal: 500,
    amountPaid: 0,
    balanceDue: 500,
    notes: null,
    finalizedAt: null,
    voidedAt: null,
    voidReason: null,
    createdOn,
    modifiedOn: createdOn,
    patient: { id: 9, mrn: 'MRN-000123', firstName: 'Aisha', lastName: 'Khan' },
    visit: null,
    admission: null,
    lines: [],
    payments: [],
    ...overrides,
  };
}

describe('invoiceLink', () => {
  it('should name what the Invoice bills', () => {
    expect(invoiceLink(makeInvoice({ visit: { id: 77, visitNumber: 'VIS-1' } }))).toBe('visit');
    expect(invoiceLink(makeInvoice({ admission: { id: 3, admissionNumber: 'ADM-1' } }))).toBe(
      'admission'
    );
    expect(invoiceLink(makeInvoice())).toBe('none');
  });
});

describe('invoiceFinalizedProperties', () => {
  it('should send line counts by source and a discount flag but no amounts', () => {
    expect(
      invoiceFinalizedProperties(
        makeInvoice({
          status: 'FINALIZED',
          discountAmount: 50,
          finalizedAt: new Date('2026-11-21T06:12:00Z'),
          admission: { id: 3, admissionNumber: 'ADM-1' },
          lines: [line('MANUAL'), line('BED_AUTO'), line('BED_AUTO')],
        })
      )
    ).toEqual({
      linked_to: 'admission',
      line_count: 3,
      manual_line_count: 1,
      bed_auto_line_count: 2,
      has_discount: true,
      resulting_status: 'FINALIZED',
      minutes_since_created: 12,
    });
  });
});

describe('invoiceVoidedProperties', () => {
  it('should read the status a voided Invoice left from whether it was finalized', () => {
    expect(invoiceVoidedProperties({ finalizedAt: null })).toEqual({ from_status: 'DRAFT' });
    expect(invoiceVoidedProperties({ finalizedAt: createdOn })).toEqual({
      from_status: 'FINALIZED',
    });
  });
});

describe('paymentRecordedProperties', () => {
  it('should send the method, resulting status, sequence and minutes since Visit Check-in', () => {
    const receivedAt = new Date('2026-11-21T07:30:00Z');
    const invoice = makeInvoice({
      status: 'PARTIALLY_PAID',
      visit: { id: 77, visitNumber: 'VIS-1' },
      payments: [payment(new Date('2026-11-21T07:00:00Z')), payment(receivedAt)],
    });

    expect(
      paymentRecordedProperties(invoice, payment(receivedAt), new Date('2026-11-21T06:05:00Z'))
    ).toEqual({
      payment_method: 'CARD',
      resulting_invoice_status: 'PARTIALLY_PAID',
      payment_sequence: 2,
      linked_to: 'visit',
      minutes_since_visit_check_in: 85,
    });
  });

  it('should leave the Check-in minutes out when the Invoice has no Visit', () => {
    expect(
      paymentRecordedProperties(
        makeInvoice({ status: 'PAID', payments: [payment(createdOn)] }),
        payment(createdOn),
        undefined
      )
    ).toMatchObject({ linked_to: 'none', minutes_since_visit_check_in: undefined });
  });
});
