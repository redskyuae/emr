import { describe, expect, it } from 'vitest';

import {
  TENDER_META,
  autoAdvanceAmount,
  describeTender,
  methodsInGroup,
  newTender,
  resolveTenders,
  validateTenders,
  withTenderField,
} from './tender';

function tender(
  method: Parameters<typeof newTender>[0],
  values: Partial<ReturnType<typeof newTender>>
) {
  return { ...newTender(method), ...values };
}

describe('resolveTenders', () => {
  it('should post the applied cash and return the rest as change', () => {
    const { resolved, paid, change } = resolveTenders([tender('CASH', { tendered: 1500 })], 1034);

    expect(resolved[0].amount).toBe(1034);
    expect(resolved[0].change).toBe(466);
    expect(paid).toBe(1034);
    expect(change).toBe(466);
  });

  it('should let cash cover only what card leaves', () => {
    const { resolved, remaining } = resolveTenders(
      [tender('CARD', { amount: 262.5 }), tender('CASH', { tendered: 200 })],
      362.5
    );

    expect(resolved.map((entry) => entry.amount)).toEqual([262.5, 100]);
    expect(remaining).toBe(0);
  });

  it('should report what is still to collect on a partial payment', () => {
    expect(resolveTenders([tender('CASH', { tendered: 300 })], 876.5).remaining).toBe(576.5);
  });
});

describe('validateTenders', () => {
  const base = { advanceBalance: 3000, allowOutstanding: false };

  it('should require the balance to be collected or marked outstanding', () => {
    const { errors } = validateTenders({ ...base, due: 876.5, tenders: [] });

    expect(errors).toEqual(['AED 876.50 still to collect, or mark it as outstanding.']);
  });

  it('should accept a partial payment when the balance is left outstanding', () => {
    const { errors } = validateTenders({
      ...base,
      due: 876.5,
      allowOutstanding: true,
      tenders: [tender('CASH', { tendered: 300 })],
    });

    expect(errors).toEqual([]);
  });

  it('should need no tender when the payer covers everything', () => {
    expect(validateTenders({ ...base, due: 0, tenders: [] }).errors).toEqual([]);
  });

  it("should require each method's own details", () => {
    const { errors } = validateTenders({
      ...base,
      due: 600,
      tenders: [
        tender('CARD', { amount: 100 }),
        tender('UPI', { amount: 100 }),
        tender('GOOGLE_PAY', { amount: 100 }),
        tender('BANK_TRANSFER', { amount: 100 }),
        tender('CHEQUE', { amount: 100 }),
        tender('OTHER', { amount: 100 }),
      ],
    });

    expect(errors).toEqual([
      'Card: enter the last 4 digits.',
      'Card: enter the approval code.',
      'UPI: enter the utr / transaction id.',
      'Google Pay: enter the transaction id.',
      'Bank transfer: enter the transfer reference.',
      'Cheque: enter the cheque number.',
      'Cheque: enter the drawee bank.',
      'Cheque: enter the cheque date.',
      'Other: enter the payment description.',
    ]);
  });

  it('should accept a fully described card payment', () => {
    const card = withTenderField(
      withTenderField(
        withTenderField(tender('CARD', { amount: 100, reference: 'A-1' }), 'last4', '4242'),
        'network',
        'Visa'
      ),
      'cardType',
      'Debit'
    );
    const result = validateTenders({ ...base, due: 100, tenders: [card] });

    expect(result.errors).toEqual([]);
    expect(describeTender(result.resolved[0])).toBe('Visa · Debit · ••4242 · approval A-1');
  });

  it('should reject malformed card digits and UPI IDs', () => {
    const card = withTenderField(tender('CARD', { amount: 50, reference: 'A-1' }), 'last4', '42');
    const upi = withTenderField(
      tender('UPI', { amount: 50, reference: 'UTR1' }),
      'upiId',
      'not-a-vpa'
    );
    const { errors } = validateTenders({ ...base, due: 100, tenders: [card, upi] });

    expect(errors).toEqual([
      'Card: the last 4 digits must be four numbers.',
      'UPI: the UPI ID must look like name@bank.',
    ]);
  });

  it('should treat the UPI ID as optional but validate it when given', () => {
    const ok = withTenderField(
      tender('UPI', { amount: 100, reference: '409112345678' }),
      'upiId',
      'priya.nair@okhdfc'
    );
    const bare = tender('UPI', { amount: 100, reference: '409112345678' });

    expect(validateTenders({ ...base, due: 100, tenders: [ok] }).errors).toEqual([]);
    expect(validateTenders({ ...base, due: 100, tenders: [bare] }).errors).toEqual([]);
    expect(describeTender(resolveTenders([ok], 100).resolved[0])).toBe(
      'priya.nair@okhdfc · UTR 409112345678'
    );
  });

  it('should describe a cheque with its number, bank and date', () => {
    const cheque = withTenderField(
      tender('CHEQUE', { amount: 100, reference: '000123', bank: 'Emirates NBD' }),
      'chequeDate',
      '2026-11-02'
    );
    const result = validateTenders({ ...base, due: 100, tenders: [cheque] });

    expect(result.errors).toEqual([]);
    expect(describeTender(result.resolved[0])).toBe('no. 000123 · Emirates NBD · 2026-11-02');
  });

  it('should not let advance exceed the available balance', () => {
    const { errors } = validateTenders({
      ...base,
      due: 876.5,
      advanceBalance: 500,
      tenders: [tender('ADVANCE', { amount: 800 }), tender('CASH', { tendered: 76.5 })],
    });

    expect(errors).toEqual(['Advance used exceeds the available balance of AED 500.00.']);
  });

  it('should not let non-cash tenders exceed the amount due', () => {
    const { errors } = validateTenders({
      ...base,
      due: 100,
      tenders: [tender('CARD', { amount: 150, reference: 'A-1' })],
    });

    expect(errors).toContain('Non-cash and advance amounts cannot exceed the amount due.');
  });
});

describe('autoAdvanceAmount', () => {
  it('should draw the whole balance when the Invoice is larger', () => {
    expect(autoAdvanceAmount(3000, 4000)).toBe(3000);
  });

  it('should draw only what is due when the balance is larger', () => {
    expect(autoAdvanceAmount(3000, 876.5)).toBe(876.5);
  });

  it('should draw nothing without a balance or without anything due', () => {
    expect(autoAdvanceAmount(0, 500)).toBe(0);
    expect(autoAdvanceAmount(500, 0)).toBe(0);
  });

  it('should leave only the remainder for cash once advance is applied', () => {
    const advance = { ...newTender('ADVANCE'), amount: autoAdvanceAmount(500, 876.5) };
    const cash = { ...newTender('CASH'), tendered: 400 };
    const { resolved, remaining, errors } = (() => {
      const result = validateTenders({
        due: 876.5,
        advanceBalance: 500,
        allowOutstanding: false,
        tenders: [advance, cash],
      });
      return { ...result };
    })();

    expect(resolved.map((entry) => entry.amount)).toEqual([500, 376.5]);
    expect(resolved[1].change).toBe(23.5);
    expect(remaining).toBe(0);
    expect(errors).toEqual([]);
  });
});

describe('payment method catalogue', () => {
  it('should group methods by where the money is reconciled', () => {
    expect(methodsInGroup('DRAWER')).toEqual(['CASH']);
    expect(methodsInGroup('CARD')).toEqual(['CARD']);
    expect(methodsInGroup('BANK')).toEqual(['UPI', 'GOOGLE_PAY', 'BANK_TRANSFER', 'CHEQUE']);
    expect(methodsInGroup('OTHER')).toEqual(['OTHER']);
    expect(methodsInGroup('ADVANCE')).toEqual(['ADVANCE']);
  });

  it('should label every method for the cashier', () => {
    expect(TENDER_META.UPI.label).toBe('UPI');
    expect(TENDER_META.GOOGLE_PAY.label).toBe('Google Pay');
  });

  it('should drop blank details when resolving', () => {
    const card = withTenderField(tender('CARD', { amount: 10 }), 'network', '  ');
    const { resolved } = resolveTenders([card], 10);

    expect(resolved[0].details).toEqual({});
  });
});
