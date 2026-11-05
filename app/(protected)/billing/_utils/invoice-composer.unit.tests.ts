import { describe, expect, it } from 'vitest';

import { invoiceComposerTotals, resolveComposerTenders } from './invoice-composer';

describe('Invoice composer amounts', () => {
  it('rounds each Charge Item line before applying an Invoice Discount', () => {
    expect(
      invoiceComposerTotals(
        [
          {
            key: '1',
            chargeItemId: 1,
            description: 'Consultation',
            quantity: 2,
            unitPrice: 10.125,
          },
        ],
        1.25
      )
    ).toEqual({ subtotal: 20.26, grandTotal: 19.01 });
  });

  it('accepts split Payments while rejecting an overpayment', () => {
    const tenders = [
      { key: 'a', method: 'CARD' as const, amount: '40', reference: 'A1' },
      { key: 'b', method: 'CASH' as const, amount: '20', reference: '' },
    ];
    expect(resolveComposerTenders(tenders, 100).remaining).toBe(40);
    expect(resolveComposerTenders(tenders, 50).errors).toContain(
      'Payments cannot exceed the Invoice total.'
    );
  });
});
