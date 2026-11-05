// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { InvoicePaymentsCard } from './invoice-payments-card';

const payment: Payment = {
  id: 19,
  amount: 300,
  invoiceId: 7,
  method: 'CASH',
  notes: null,
  receiptNumber: 'RCP-1019',
  receivedAt: new Date('2026-10-29T05:30:00Z'),
  reference: null,
};

const invoice = {
  id: 7,
  lines: [],
  notes: null,
  payments: [payment],
  status: 'PAID',
  tenantId: 'tenant-1',
  subtotal: 300,
  balanceDue: 0,
  amountPaid: 300,
  discountAmount: 0,
  grandTotal: 300,
  invoiceNumber: 'INV-1007',
  finalizedAt: new Date('2026-10-29T05:00:00Z'),
  voidedAt: null,
  voidReason: null,
  createdOn: new Date('2026-10-29T04:00:00Z'),
  modifiedOn: new Date('2026-10-29T05:30:00Z'),
  patient: { id: 3, firstName: 'Meera', lastName: 'Nair', mrn: 'MRN-1003' },
  visit: null,
  admission: null,
} satisfies Invoice;

afterEach(cleanup);

describe('Invoice Payments receipt action', () => {
  it('should reopen a recorded receipt from Payment history', async () => {
    const user = userEvent.setup();
    const onViewReceipt = vi.fn();
    render(
      createElement(InvoicePaymentsCard, {
        invoice,
        canRecordPayment: true,
        onRecordPayment: vi.fn(),
        onViewReceipt,
      })
    );

    await user.click(screen.getByRole('button', { name: 'View receipt RCP-1019' }));
    expect(onViewReceipt).toHaveBeenCalledWith(payment);
  });
});
