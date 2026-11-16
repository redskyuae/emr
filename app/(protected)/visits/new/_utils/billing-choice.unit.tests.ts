import { describe, expect, it } from 'vitest';

import { billingChoiceOf, billingChoiceValues, billingTotals } from './billing-choice';

describe('billingChoiceOf', () => {
  it('should map the Invoice and Payment timing flags to one choice', () => {
    expect(billingChoiceOf({ createInvoice: false, paymentTiming: 'NOW' })).toBe('none');
    expect(billingChoiceOf({ createInvoice: true, paymentTiming: 'LATER' })).toBe('later');
    expect(billingChoiceOf({ createInvoice: true, paymentTiming: 'NOW' })).toBe('now');
  });
});

describe('billingChoiceValues', () => {
  it('should clear the amount received unless Payment is collected now', () => {
    expect(billingChoiceValues('none', '500')).toEqual({
      createInvoice: false,
      paymentTiming: 'LATER',
      amountReceived: '0',
    });
    expect(billingChoiceValues('later', '500')).toEqual({
      createInvoice: true,
      paymentTiming: 'LATER',
      amountReceived: '0',
    });
  });

  it('should collect the full charge by default when Payment is taken now', () => {
    expect(billingChoiceValues('now', '500')).toEqual({
      createInvoice: true,
      paymentTiming: 'NOW',
      amountReceived: '500',
    });
  });
});

describe('billingTotals', () => {
  it('should have no totals without an Invoice', () => {
    expect(
      billingTotals({
        createInvoice: false,
        paymentTiming: 'LATER',
        chargeAmount: '500',
        amountReceived: '0',
      })
    ).toEqual({ choice: 'none', charge: null, collected: null, balance: null });
  });

  it('should leave the full charge due when paying later', () => {
    expect(
      billingTotals({
        createInvoice: true,
        paymentTiming: 'LATER',
        chargeAmount: '500',
        amountReceived: '0',
      })
    ).toEqual({ choice: 'later', charge: 500, collected: 0, balance: 500 });
  });

  it('should show the Balance Due after a partial Payment', () => {
    expect(
      billingTotals({
        createInvoice: true,
        paymentTiming: 'NOW',
        chargeAmount: '500',
        amountReceived: '300',
      })
    ).toEqual({ choice: 'now', charge: 500, collected: 300, balance: 200 });
  });

  it('should not report a balance before a charge is set', () => {
    expect(
      billingTotals({
        createInvoice: true,
        paymentTiming: 'NOW',
        chargeAmount: '',
        amountReceived: '',
      })
    ).toEqual({ choice: 'now', charge: null, collected: 0, balance: null });
  });
});
