import { describe, expect, it } from 'vitest';

import { COUNTER_PATIENTS, createSeedState } from '../_data/counter-seed';
import {
  buildAdvanceTxn,
  buildBankBook,
  buildCashBook,
  buildCreditNoteTxn,
  buildInvoiceTxn,
  buildSalesBook,
  computeCashDrawer,
  computeDayTotals,
  counterReducer,
  reconcileShift,
  refundableOf,
  validateClose,
  validateOpening,
  validateRefund,
} from './counter-ledger';
import { newInvoiceLine } from './invoice-calc';
import { CHARGE_ITEMS } from '../_data/counter-seed';

const priya = COUNTER_PATIENTS.find((patient) => patient.mrn === 'AYU000110')!;
const anna = COUNTER_PATIENTS.find((patient) => patient.mrn === 'AYU000129')!;

describe('seed ledger', () => {
  const state = createSeedState();

  it('should reproduce the Day-close figures from the cashier screen', () => {
    const totals = computeDayTotals(state.ledger);

    expect(totals.cashCollected).toBe(36503);
    expect(totals.cardCollected).toBe(2306.6);
    expect(totals.advancesReceived).toBe(36000);
    expect(totals.billedToPayers).toBe(1079.4);
    expect(totals.refunds).toBe(4000);
    expect(totals.outstanding).toBe(0);
    expect(totals.invoices).toBe(6);
  });

  it('should expect 33,503.00 cash in the drawer', () => {
    const drawer = computeCashDrawer(state.shift, state.ledger);

    expect(drawer.expectedCash).toBe(33503);
    expect(drawer.expectedCard).toBe(2306.6);
  });

  it('should keep every seeded advance balance equal to advances less refunds', () => {
    expect(state.advanceBalances.AYU000129).toBe(26000);
    expect(state.advanceBalances.AYU000131).toBe(4000);
  });

  it('should close the cash book on the expected drawer cash', () => {
    expect(buildCashBook(state.shift, state.ledger).closing).toBe(33503);
  });

  it('should list only card transactions in the bank book for this seed', () => {
    expect(new Set(buildBankBook(state.ledger).map((row) => row.tender.method))).toEqual(
      new Set(['CARD'])
    );
  });

  it('should total VAT in the sales book net of the credit note', () => {
    const book = buildSalesBook(state.ledger);

    expect(book.rows.some((row) => row.type === 'ADVANCE')).toBe(false);
    expect(book.total).toBe(472.5 + 362.5 + 682.5 + 461 + 876.5 + 1034 - 4000);
  });
});

describe('posting an Invoice', () => {
  it('should use the advance balance and give the next Invoice number', () => {
    const state = createSeedState();
    const lines = [
      newInvoiceLine(
        CHARGE_ITEMS.find((item) => item.code === 'ABH')!,
        false
      ),
    ];
    const txn = buildInvoiceTxn({
      state,
      lines,
      patient: priya,
      outstanding: 0,
      visitNumber: 'VST-1024',
      tenders: [
        { method: 'ADVANCE', amount: 367.5, reference: '', bank: '', tendered: null, change: 0 },
      ],
    });
    const next = counterReducer(state, { type: 'POST', txn });

    expect(txn.number).toMatch(/-002421$/);
    expect(next.advanceBalances.AYU000110).toBe(3000 - 367.5);
    expect(next.sequences.inv).toBe(2421);
    expect(next.ledger[0]).toBe(txn);
    expect(computeDayTotals(next.ledger).advanceApplied).toBe(367.5);
  });
});

describe('posting an Advance', () => {
  it('should raise the balance and record the VAT portion', () => {
    const state = createSeedState();
    const txn = buildAdvanceTxn({
      state,
      patient: priya,
      amount: 1050,
      purpose: 'Treatment advance',
      tenders: [
        { method: 'CASH', amount: 1050, tendered: 1050, reference: '', bank: '', change: 0 },
      ],
    });
    const next = counterReducer(state, { type: 'POST', txn });

    expect(txn.vat).toBe(50);
    expect(txn.taxable).toBe(1000);
    expect(next.advanceBalances.AYU000110).toBe(4050);
    expect(next.sequences.rcp).toBe(state.sequences.rcp + 1);
  });
});

describe('refunds', () => {
  it('should offer the whole advance balance and reduce it after a refund', () => {
    const state = createSeedState();
    const source = { kind: 'ADVANCE' } as const;

    expect(refundableOf(source, state.advanceBalances.AYU000129, state.ledger)).toBe(26000);

    const txn = buildCreditNoteTxn({
      state,
      source,
      patient: anna,
      amount: 1000,
      method: 'CASH',
      reference: '',
      reason: 'Billing error',
      approvedBy: 'Hassan Ali (Finance Manager)',
    });
    const next = counterReducer(state, { type: 'POST', txn });

    expect(next.advanceBalances.AYU000129).toBe(25000);
    expect(txn.patientPaid).toBe(-1000);
    expect(computeCashDrawer(next.shift, next.ledger).expectedCash).toBe(32503);
  });

  it('should leave only unrefunded tendered money refundable on an Invoice', () => {
    const state = createSeedState();
    const invoice = state.ledger.find((txn) => txn.number === 'AUH-INV-2026-002414')!;
    const source = { kind: 'INVOICE', invoice } as const;

    expect(refundableOf(source, 0, state.ledger)).toBe(362.5);

    const txn = buildCreditNoteTxn({
      state,
      source,
      patient: anna,
      amount: 100,
      method: 'CASH',
      reference: '',
      reason: 'Overpayment',
      approvedBy: 'Hassan Ali (Finance Manager)',
    });

    expect(refundableOf(source, 0, [txn, ...state.ledger])).toBe(262.5);
  });

  it('should return the exact validation messages from the cashier screen', () => {
    const errors = validateRefund({
      amount: 0,
      refundable: 27000,
      method: 'CASH',
      reference: '',
      reason: '',
      approvedBy: '',
      cashInDrawer: 33503,
    });

    expect(errors).toEqual([
      'Enter the refund amount.',
      'Choose a reason.',
      'Refunds need approval.',
    ]);
  });

  it('should block a cash refund larger than the drawer and a refund above the refundable', () => {
    const base = {
      refundable: 500,
      reference: '',
      reason: 'Billing error',
      approvedBy: 'Hassan Ali (Finance Manager)',
    };

    expect(
      validateRefund({
        ...base,
        amount: 600,
        method: 'BANK_TRANSFER',
        reference: 'T-1',
        cashInDrawer: 0,
      })
    ).toEqual(['Refund cannot exceed the refundable AED 500.00.']);
    expect(validateRefund({ ...base, amount: 400, method: 'CASH', cashInDrawer: 300 })).toEqual([
      'Cash refund exceeds the AED 300.00 in the drawer.',
    ]);
  });

  it('should require a reference for bank refunds', () => {
    const errors = validateRefund({
      amount: 100,
      refundable: 500,
      method: 'BANK_TRANSFER',
      reference: '',
      reason: 'Billing error',
      approvedBy: 'Hassan Ali (Finance Manager)',
      cashInDrawer: 0,
    });

    expect(errors).toEqual(['Enter the transfer reference.']);
  });
});

describe('shift opening and closing', () => {
  it('should accept the default float without an authorizer', () => {
    expect(validateOpening({ floatAmount: 1000, authorizedBy: '' })).toEqual([]);
  });

  it('should need an authorizer for any other float', () => {
    expect(validateOpening({ floatAmount: 1500, authorizedBy: '' })).toHaveLength(1);
    expect(validateOpening({ floatAmount: 1500, authorizedBy: 'Hassan Ali' })).toEqual([]);
  });

  it('should compute variance against the expected balances', () => {
    expect(
      reconcileShift({
        expectedCash: 33503,
        expectedCard: 2306.6,
        cashCounted: 33490,
        cardBatchTotal: 2306.6,
      })
    ).toEqual({ cashVariance: -13, cardDifference: 0 });
  });

  it('should require counts, then a reason, then supervisor approval for large variances', () => {
    expect(
      validateClose({ cashVariance: null, cardDifference: null, reason: '', approvedBy: '' })
    ).toEqual(['Enter the cash counted.', 'Enter the card terminal batch total.']);
    expect(
      validateClose({ cashVariance: -13, cardDifference: 0, reason: '', approvedBy: '' })
    ).toEqual(['Explain the variance before closing the shift.']);
    expect(
      validateClose({ cashVariance: -80, cardDifference: 0, reason: 'Miscount', approvedBy: '' })
    ).toEqual(['A variance above AED 50 needs supervisor approval.']);
    expect(
      validateClose({ cashVariance: 0, cardDifference: 0, reason: '', approvedBy: '' })
    ).toEqual([]);
  });

  it('should archive the closed shift and start the next with a clean ledger', () => {
    const state = createSeedState();
    const closed = counterReducer(state, {
      type: 'CLOSE_SHIFT',
      closing: {
        closedAt: '18:00',
        cashCounted: 33503,
        cardBatchTotal: 2306.6,
        cashVariance: 0,
        cardDifference: 0,
        expectedCash: 33503,
        closedBy: 'Reem K. (Cashier)',
        retainedFloat: 1000,
        depositToSafe: 32503,
        varianceReason: null,
        varianceApprovedBy: null,
      },
    });
    const reopened = counterReducer(closed, {
      type: 'OPEN_SHIFT',
      floatAmount: 1000,
      authorizedBy: null,
      cashier: 'Reem K. (Cashier)',
    });

    expect(closed.shift.status).toBe('CLOSED');
    expect(reopened.shift.no).toBe(2);
    expect(reopened.shift.status).toBe('OPEN');
    expect(reopened.ledger).toEqual([]);
    expect(reopened.closedShifts).toHaveLength(1);
    expect(reopened.closedShifts[0].txnCount).toBe(10);
  });
});
