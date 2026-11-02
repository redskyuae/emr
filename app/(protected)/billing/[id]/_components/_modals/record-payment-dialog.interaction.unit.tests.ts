// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Invoice, Payment } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { useRecordPayment } from '@/app/queries/billing/invoices/useRecordPayment';
import { RecordPaymentDialog } from './record-payment-dialog';

vi.mock('@/app/queries/billing/invoices/useRecordPayment', () => ({
  useRecordPayment: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const recordPayment = vi.mocked(useRecordPayment);
const mutateAsync = vi.fn();

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

const invoice: Invoice = {
  id: 7,
  lines: [],
  notes: null,
  payments: [],
  status: 'FINALIZED',
  tenantId: 'tenant-1',
  subtotal: 300,
  balanceDue: 300,
  amountPaid: 0,
  discountAmount: 0,
  grandTotal: 300,
  invoiceNumber: 'INV-1007',
  finalizedAt: new Date('2026-10-29T05:00:00Z'),
  voidedAt: null,
  voidReason: null,
  createdOn: new Date('2026-10-29T04:00:00Z'),
  modifiedOn: new Date('2026-10-29T05:00:00Z'),
  patient: { id: 3, firstName: 'Meera', lastName: 'Nair', mrn: 'MRN-1003' },
  visit: null,
  admission: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsync.mockResolvedValue({
    data: {
      payment,
      invoice: { ...invoice, status: 'PAID', amountPaid: 300, balanceDue: 0, payments: [payment] },
    },
  });
  recordPayment.mockReturnValue({ mutateAsync, isPending: false } as never);
});

afterEach(cleanup);

describe('Record Payment receipt handoff', () => {
  it('should hand the automatically recorded receipt to the Invoice screen', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onRecorded = vi.fn();
    render(
      createElement(RecordPaymentDialog, {
        invoice,
        open: true,
        onClose,
        onRecorded,
      })
    );

    await waitFor(() => {
      expect((screen.getByLabelText(/Amount/) as HTMLInputElement).value).toBe('300');
    });
    await user.click(screen.getByRole('button', { name: 'Record payment' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 7,
        request: {
          amount: 300,
          method: 'CASH',
          notes: undefined,
          reference: undefined,
        },
      });
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(onRecorded).toHaveBeenCalledWith({
      payment,
      invoice: expect.objectContaining({ status: 'PAID', balanceDue: 0 }),
    });
  });
});
