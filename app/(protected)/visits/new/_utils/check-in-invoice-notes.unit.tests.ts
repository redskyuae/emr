import { describe, expect, it } from 'vitest';

import { checkInInvoiceNotes } from './check-in-invoice-notes';

describe('checkInInvoiceNotes', () => {
  it('leaves ordinary self-pay Invoices without reimbursement notes', () => {
    expect(
      checkInInvoiceNotes({ paymentClassification: 'SELF_PAY', insurer: '', policyReference: '' })
    ).toBeUndefined();
  });

  it('records reimbursement details as documentation, not as a claim', () => {
    expect(
      checkInInvoiceNotes({
        paymentClassification: 'REIMBURSEMENT',
        insurer: 'Example Health',
        policyReference: 'POL-123',
      })
    ).toContain('Insurer: Example Health\nPolicy / Member Reference: POL-123');
  });
});
