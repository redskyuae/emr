// @vitest-environment jsdom

import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { InvoiceLinesCard } from './invoice-lines-card';

const draftInvoice = {
  id: 7,
  lines: [],
  notes: null,
  payments: [],
  status: 'DRAFT',
  tenantId: 'tenant-1',
  subtotal: 0,
  balanceDue: 0,
  amountPaid: 0,
  discountAmount: 0,
  grandTotal: 0,
  invoiceNumber: 'INV-1007',
  finalizedAt: null,
  voidedAt: null,
  voidReason: null,
  createdOn: new Date('2026-10-29T04:00:00Z'),
  modifiedOn: new Date('2026-10-29T04:00:00Z'),
  patient: { id: 3, firstName: 'Meera', lastName: 'Nair', mrn: 'MRN-1003' },
  visit: null,
  admission: null,
} satisfies Invoice;

afterEach(cleanup);

function renderEmptyLines(invoice: Invoice, canUpdate: boolean) {
  return render(
    createElement(InvoiceLinesCard, {
      invoice,
      canUpdate,
      isRemoving: false,
      canGenerateCharges: false,
      onAddLine: vi.fn(),
      onRemoveLine: vi.fn(),
      onGenerateBedCharges: vi.fn(),
    })
  );
}

describe('Invoice Charges empty state', () => {
  it('should prompt for a Charge Item on a draft the user may edit', () => {
    const { container } = renderEmptyLines(draftInvoice, true);

    const root = container.querySelector('[data-slot="empty"]');

    expect(screen.getByText('No line items yet')).toBeTruthy();
    expect(screen.getByText('Add a Charge Item to get started.')).toBeTruthy();
    expect(root?.getAttribute('data-tone')).toBe('green');
    expect(root?.getAttribute('data-size')).toBe('sm');
  });

  it('should show no description on a draft the user may not edit', () => {
    const { container } = renderEmptyLines(draftInvoice, false);

    expect(screen.getByText('No line items yet')).toBeTruthy();
    expect(screen.queryByText('Add a Charge Item to get started.')).toBeNull();
    expect(container.querySelector('[data-slot="empty-description"]')).toBeNull();
  });

  it('should show no description once the Invoice is no longer a draft', () => {
    const { container } = renderEmptyLines({ ...draftInvoice, status: 'FINALIZED' }, true);

    expect(screen.getByText('No line items yet')).toBeTruthy();
    expect(container.querySelector('[data-slot="empty-description"]')).toBeNull();
  });
});
