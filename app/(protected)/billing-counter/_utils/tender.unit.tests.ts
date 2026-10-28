import { describe, expect, it } from 'vitest';

import { newTender, resolveTenders, validateTenders } from './tender';

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

  it('should require a reference for card, cheque, transfer and Google Pay', () => {
    const { errors } = validateTenders({
      ...base,
      due: 400,
      tenders: [
        tender('CARD', { amount: 100 }),
        tender('CHEQUE', { amount: 100 }),
        tender('BANK_TRANSFER', { amount: 100 }),
        tender('GOOGLE_PAY', { amount: 100 }),
      ],
    });

    expect(errors).toEqual([
      'Card: enter the approval code.',
      'Cheque: enter the cheque number.',
      'Cheque: enter the drawee bank.',
      'Bank transfer: enter the transfer reference.',
      'Google Pay: enter the transaction id.',
    ]);
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

    expect(errors).toContain(
      'Card, transfer, cheque, Google Pay and advance amounts cannot exceed the amount due.'
    );
  });
});
