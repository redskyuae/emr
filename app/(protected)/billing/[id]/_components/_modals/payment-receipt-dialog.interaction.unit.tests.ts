// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { PaymentReceiptDialog } from './payment-receipt-dialog';

const payment: Payment = {
  id: 19,
  amount: 300,
  invoiceId: 7,
  method: 'UPI',
  notes: 'Paid at reception',
  receiptNumber: 'RCP-1019',
  receivedAt: new Date('2026-10-29T05:30:00Z'),
  reference: 'UPI-445566',
};

const invoice: Invoice = {
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
};

afterEach(() => {
  cleanup();
  document.body.classList.remove('payment-receipt-printing');
  vi.restoreAllMocks();
});

describe('Payment receipt dialog', () => {
  it('should display the saved Payment receipt and print only on request', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    render(
      createElement(PaymentReceiptDialog, {
        open: true,
        invoice,
        payment,
        onClose: vi.fn(),
        tenantName: 'Dhathri Ayurvedic',
        timeZone: 'Asia/Kolkata',
      })
    );

    expect(screen.getByText('Dhathri Ayurvedic')).toBeTruthy();
    expect(screen.getByText('RCP-1019')).toBeTruthy();
    expect(screen.getByText('Meera Nair')).toBeTruthy();
    expect(screen.getByText('MRN-1003')).toBeTruthy();
    expect(screen.getByText('INV-1007')).toBeTruthy();
    expect(screen.getByText('UPI-445566')).toBeTruthy();
    expect(screen.getByText('Payment recorded')).toBeTruthy();
    expect(screen.getByText('Thank you for choosing Dhathri Ayurvedic.')).toBeTruthy();
    expect(screen.getByText(/does not require a signature/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Print receipt' }));
    expect(print).toHaveBeenCalledOnce();
    expect(document.body.classList.contains('payment-receipt-printing')).toBe(true);

    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.classList.contains('payment-receipt-printing')).toBe(false);
  });
});
