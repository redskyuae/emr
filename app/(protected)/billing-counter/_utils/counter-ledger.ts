import { format } from 'date-fns';

import { round2, splitVatInclusive } from './money';
import { calculateInvoice } from './invoice-calc';
import { COLLECTION_METHODS, methodsInGroup, refundReferenceLabel } from './tender';
import type {
  ClosingFigures,
  CounterPatient,
  CounterState,
  InvoiceLine,
  LedgerTxn,
  ResolvedTender,
  ShiftState,
  TenderMethod,
} from './counter-types';

export const ADVANCE_VAT_RATE = 5;
export const DEFAULT_OPENING_FLOAT = 1000;
// Variances above this need a supervisor's sign-off, not just a reason.
export const SUPERVISOR_VARIANCE_LIMIT = 50;

type Sequence = keyof CounterState['sequences'];

function pad(value: number) {
  return String(value).padStart(6, '0');
}

function nextNumber(state: CounterState, sequence: Sequence) {
  const prefix = { inv: 'INV', adv: 'ADV', cn: 'CN', rcp: 'RCP' }[sequence];
  const year = new Date().getFullYear();
  const value = state.sequences[sequence] + 1;

  return `AUH-${prefix}-${year}-${pad(value)}`;
}

function nowTime() {
  return format(new Date(), 'HH:mm');
}

function txnId(number: string) {
  return `${number}-${Math.random().toString(36).slice(2, 7)}`;
}

function sumTenders(tenders: ResolvedTender[], methods?: TenderMethod[]) {
  return round2(
    tenders
      .filter((tender) => !methods || methods.includes(tender.method))
      .reduce((total, tender) => total + tender.amount, 0)
  );
}

export function buildInvoiceTxn({
  state,
  patient,
  visitNumber,
  lines,
  tenders,
  outstanding,
  discountReason = null,
  discountApprovedBy = null,
  payerAuthNumber = null,
}: {
  state: CounterState;
  patient: CounterPatient;
  visitNumber: string | null;
  lines: InvoiceLine[];
  tenders: ResolvedTender[];
  outstanding: number;
  discountReason?: string | null;
  discountApprovedBy?: string | null;
  payerAuthNumber?: string | null;
}): LedgerTxn {
  const totals = calculateInvoice(lines);
  const number = nextNumber(state, 'inv');
  const patientPaid = sumTenders(tenders);

  return {
    number,
    visitNumber,
    outstanding,
    tenders,
    patientPaid,
    id: txnId(number),
    type: 'INVOICE',
    against: null,
    reason: null,
    approvedBy: null,
    discountReason: totals.discount > 0 ? discountReason : null,
    discountApprovedBy: totals.discount > 0 ? discountApprovedBy : null,
    payerAuthNumber: totals.payerShare > 0 ? payerAuthNumber : null,
    refundOfInvoice: null,
    time: nowTime(),
    vat: totals.vat,
    total: totals.total,
    taxable: totals.taxable,
    patientMrn: patient.mrn,
    patientName: patient.name,
    shiftNo: state.shift.no,
    payerShare: totals.payerShare,
    description: lines.map((line) => line.description).join(', '),
    lines: totals.lines,
    receiptNumber: patientPaid > 0 ? nextNumber(state, 'rcp') : null,
  };
}

export function buildAdvanceTxn({
  state,
  patient,
  amount,
  purpose,
  tenders,
}: {
  state: CounterState;
  patient: CounterPatient;
  amount: number;
  purpose: string;
  tenders: ResolvedTender[];
}): LedgerTxn {
  const number = nextNumber(state, 'adv');
  const { net, vat } = splitVatInclusive(amount, ADVANCE_VAT_RATE);

  return {
    vat,
    number,
    tenders,
    lines: [],
    total: amount,
    taxable: net,
    outstanding: 0,
    payerShare: 0,
    against: null,
    reason: purpose,
    approvedBy: null,
    discountReason: null,
    discountApprovedBy: null,
    payerAuthNumber: null,
    visitNumber: null,
    patientPaid: amount,
    type: 'ADVANCE',
    id: txnId(number),
    time: nowTime(),
    refundOfInvoice: null,
    description: purpose,
    patientMrn: patient.mrn,
    patientName: patient.name,
    shiftNo: state.shift.no,
    receiptNumber: nextNumber(state, 'rcp'),
  };
}

export type RefundSource = { kind: 'ADVANCE' } | { kind: 'INVOICE'; invoice: LedgerTxn };

export function refundableOf(source: RefundSource, advanceBalance: number, ledger: LedgerTxn[]) {
  if (source.kind === 'ADVANCE') {
    return advanceBalance;
  }

  // Only money actually tendered can go back; advance applied to the Invoice
  // stays with the advance account.
  const tendered = sumTenders(source.invoice.tenders, COLLECTION_METHODS);
  const refunded = round2(
    ledger
      .filter((txn) => txn.refundOfInvoice === source.invoice.number)
      .reduce((total, txn) => total + Math.abs(txn.patientPaid), 0)
  );

  return Math.max(0, round2(tendered - refunded));
}

export function buildCreditNoteTxn({
  state,
  patient,
  source,
  amount,
  method,
  reference,
  reason,
  approvedBy,
}: {
  state: CounterState;
  patient: CounterPatient;
  source: RefundSource;
  amount: number;
  method: TenderMethod;
  reference: string;
  reason: string;
  approvedBy: string;
}): LedgerTxn {
  const number = nextNumber(state, 'cn');
  const vatRate = source.kind === 'ADVANCE' ? ADVANCE_VAT_RATE : null;
  const { net, vat } =
    vatRate !== null
      ? splitVatInclusive(amount, vatRate)
      : (() => {
          const ratio = source.kind === 'INVOICE' ? source.invoice.vat / source.invoice.total : 0;
          const vatPart = round2(amount * ratio);
          return { net: round2(amount - vatPart), vat: vatPart };
        })();

  return {
    number,
    reason,
    approvedBy,
    discountReason: null,
    discountApprovedBy: null,
    payerAuthNumber: null,
    id: txnId(number),
    lines: [],
    outstanding: 0,
    payerShare: 0,
    visitNumber: null,
    time: nowTime(),
    receiptNumber: null,
    total: -amount,
    vat: -vat,
    taxable: -net,
    patientPaid: -amount,
    type: 'CREDIT_NOTE',
    patientMrn: patient.mrn,
    patientName: patient.name,
    shiftNo: state.shift.no,
    description: reason,
    tenders: [{ method, amount, reference, bank: '', details: {}, tendered: null, change: 0 }],
    against: source.kind === 'ADVANCE' ? 'Advance balance' : source.invoice.number,
    refundOfInvoice: source.kind === 'INVOICE' ? source.invoice.number : null,
  };
}

export function validateRefund({
  amount,
  refundable,
  method,
  reference,
  reason,
  approvedBy,
  cashInDrawer,
}: {
  amount: number;
  refundable: number;
  method: TenderMethod;
  reference: string;
  reason: string;
  approvedBy: string;
  cashInDrawer: number;
}) {
  const errors: string[] = [];

  if (!(amount > 0)) {
    errors.push('Enter the refund amount.');
  } else if (amount > refundable) {
    errors.push(`Refund cannot exceed the refundable AED ${refundable.toFixed(2)}.`);
  }

  if (method === 'CASH' && amount > cashInDrawer) {
    errors.push(`Cash refund exceeds the AED ${cashInDrawer.toFixed(2)} in the drawer.`);
  }

  if (method !== 'CASH' && !reference.trim()) {
    errors.push(`Enter the ${refundReferenceLabel(method).toLowerCase()}.`);
  }

  if (!reason) {
    errors.push('Choose a reason.');
  }

  if (!approvedBy) {
    errors.push('Refunds need approval.');
  }

  return errors;
}

const bankMethods = methodsInGroup('BANK');
const otherMethods = methodsInGroup('OTHER');

/** Receipts, refunds and net per payment method; Advance applied is reported apart. */
export function computeMethodBreakdown(txns: LedgerTxn[]) {
  const total = (types: LedgerTxn['type'][], method: TenderMethod) =>
    round2(
      txns
        .filter((txn) => types.includes(txn.type))
        .reduce((sum, txn) => sum + sumTenders(txn.tenders, [method]), 0)
    );

  return COLLECTION_METHODS.map((method) => {
    const received = total(['INVOICE', 'ADVANCE'], method);
    const refunded = total(['CREDIT_NOTE'], method);

    return { method, received, refunded, net: round2(received - refunded) };
  });
}

export function computeDayTotals(txns: LedgerTxn[]) {
  const sumOf = (type: LedgerTxn['type'], methods: TenderMethod[]) =>
    round2(
      txns
        .filter((txn) => txn.type === type)
        .reduce((total, txn) => total + sumTenders(txn.tenders, methods), 0)
    );

  return {
    cashCollected: round2(sumOf('INVOICE', ['CASH']) + sumOf('ADVANCE', ['CASH'])),
    cardCollected: round2(sumOf('INVOICE', ['CARD']) + sumOf('ADVANCE', ['CARD'])),
    bankAndDigital: round2(sumOf('INVOICE', bankMethods) + sumOf('ADVANCE', bankMethods)),
    otherCollected: round2(sumOf('INVOICE', otherMethods) + sumOf('ADVANCE', otherMethods)),
    advanceApplied: sumOf('INVOICE', ['ADVANCE']),
    advancesReceived: round2(
      txns.filter((txn) => txn.type === 'ADVANCE').reduce((total, txn) => total + txn.total, 0)
    ),
    billedToPayers: round2(txns.reduce((total, txn) => total + txn.payerShare, 0)),
    outstanding: round2(txns.reduce((total, txn) => total + txn.outstanding, 0)),
    refunds: round2(
      txns
        .filter((txn) => txn.type === 'CREDIT_NOTE')
        .reduce((t, txn) => t + Math.abs(txn.total), 0)
    ),
    invoices: txns.filter((txn) => txn.type === 'INVOICE').length,
  };
}

export function computeCashDrawer(shift: ShiftState, txns: LedgerTxn[]) {
  const totals = computeDayTotals(txns);
  const cashRefunds = sumOf(txns, 'CASH');
  const cardRefunds = sumOf(txns, 'CARD');

  return {
    cashRefunds,
    opening: shift.openingFloat,
    cashReceived: totals.cashCollected,
    expectedCash: round2(shift.openingFloat + totals.cashCollected - cashRefunds),
    expectedCard: round2(totals.cardCollected - cardRefunds),
  };
}

function sumOf(txns: LedgerTxn[], method: TenderMethod) {
  return round2(
    txns
      .filter((txn) => txn.type === 'CREDIT_NOTE')
      .reduce((total, txn) => total + sumTenders(txn.tenders, [method]), 0)
  );
}

export function validateOpening({
  floatAmount,
  authorizedBy,
}: {
  floatAmount: number;
  authorizedBy: string;
}) {
  const errors: string[] = [];

  if (!(floatAmount >= 0)) {
    errors.push('Enter the opening float.');
  } else if (floatAmount !== DEFAULT_OPENING_FLOAT && !authorizedBy) {
    errors.push(
      `A float other than the default AED ${DEFAULT_OPENING_FLOAT.toFixed(2)} needs an authorizing supervisor.`
    );
  }

  return errors;
}

export function reconcileShift({
  expectedCash,
  expectedCard,
  cashCounted,
  cardBatchTotal,
}: {
  expectedCash: number;
  expectedCard: number;
  cashCounted: number | null;
  cardBatchTotal: number | null;
}) {
  return {
    cashVariance: cashCounted === null ? null : round2(cashCounted - expectedCash),
    cardDifference: cardBatchTotal === null ? null : round2(cardBatchTotal - expectedCard),
  };
}

export function validateClose({
  cashVariance,
  cardDifference,
  reason,
  approvedBy,
}: {
  cashVariance: number | null;
  cardDifference: number | null;
  reason: string;
  approvedBy: string;
}) {
  const errors: string[] = [];

  if (cashVariance === null) {
    errors.push('Enter the cash counted.');
  }

  if (cardDifference === null) {
    errors.push('Enter the card terminal batch total.');
  }

  const hasDifference = (cashVariance ?? 0) !== 0 || (cardDifference ?? 0) !== 0;

  if (hasDifference && !reason.trim()) {
    errors.push('Explain the variance before closing the shift.');
  }

  const largest = Math.max(Math.abs(cashVariance ?? 0), Math.abs(cardDifference ?? 0));

  if (largest > SUPERVISOR_VARIANCE_LIMIT && !approvedBy) {
    errors.push(`A variance above AED ${SUPERVISOR_VARIANCE_LIMIT} needs supervisor approval.`);
  }

  return errors;
}

export type CounterAction =
  | { type: 'POST'; txn: LedgerTxn }
  | { type: 'RESET'; state: CounterState }
  | { type: 'CLOSE_SHIFT'; closing: ClosingFigures }
  | { type: 'OPEN_SHIFT'; floatAmount: number; authorizedBy: string | null; cashier: string };

function advanceDelta(txn: LedgerTxn) {
  if (txn.type === 'ADVANCE') {
    return txn.total;
  }

  if (txn.type === 'INVOICE') {
    return -sumTenders(txn.tenders, ['ADVANCE']);
  }

  return txn.refundOfInvoice ? 0 : txn.total;
}

export function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'RESET':
      return action.state;
    case 'POST': {
      const { txn } = action;
      const sequences: Record<LedgerTxn['type'], Sequence> = {
        INVOICE: 'inv',
        ADVANCE: 'adv',
        CREDIT_NOTE: 'cn',
      };
      const sequence = sequences[txn.type];

      return {
        ...state,
        ledger: [txn, ...state.ledger],
        sequences: {
          ...state.sequences,
          [sequence]: state.sequences[sequence] + 1,
          rcp: state.sequences.rcp + (txn.receiptNumber ? 1 : 0),
        },
        advanceBalances: {
          ...state.advanceBalances,
          [txn.patientMrn]: round2(
            (state.advanceBalances[txn.patientMrn] ?? 0) + advanceDelta(txn)
          ),
        },
      };
    }
    case 'CLOSE_SHIFT':
      return {
        ...state,
        shift: { ...state.shift, status: 'CLOSED', closing: action.closing },
      };
    case 'OPEN_SHIFT': {
      const closedShifts = [
        ...state.closedShifts,
        {
          shift: state.shift,
          txnCount: state.ledger.filter((txn) => txn.shiftNo === state.shift.no).length,
        },
      ];

      return {
        ...state,
        closedShifts,
        ledger: state.ledger.filter((txn) => txn.shiftNo !== state.shift.no),
        shift: {
          closing: null,
          status: 'OPEN',
          no: state.shift.no + 1,
          counter: state.shift.counter,
          cashier: action.cashier,
          authorizedBy: action.authorizedBy,
          openingFloat: action.floatAmount,
          openedAt: nowTime(),
          openingBasis: action.floatAmount === DEFAULT_OPENING_FLOAT ? 'DEFAULT' : 'AUTHORIZED',
        },
      };
    }
  }
}

export function buildCashBook(shift: ShiftState, txns: LedgerTxn[]) {
  const movements = [...txns]
    .sort((a, b) => a.time.localeCompare(b.time))
    .flatMap((txn) => {
      const cash = sumTenders(txn.tenders, ['CASH']);
      return cash > 0
        ? [
            {
              txn,
              cashIn: txn.type === 'CREDIT_NOTE' ? 0 : cash,
              cashOut: txn.type === 'CREDIT_NOTE' ? cash : 0,
            },
          ]
        : [];
    });
  let balance = shift.openingFloat;

  return {
    opening: shift.openingFloat,
    rows: movements.map((movement) => {
      balance = round2(balance + movement.cashIn - movement.cashOut);
      return { ...movement, balance };
    }),
    closing: balance,
  };
}

export function buildBankBook(txns: LedgerTxn[]) {
  return [...txns]
    .sort((a, b) => a.time.localeCompare(b.time))
    .flatMap((txn) =>
      txn.tenders
        .filter((tender) => tender.method !== 'CASH' && tender.method !== 'ADVANCE')
        .map((tender) => ({
          txn,
          tender,
          receipt: txn.type === 'CREDIT_NOTE' ? 0 : tender.amount,
          payment: txn.type === 'CREDIT_NOTE' ? tender.amount : 0,
        }))
    );
}

export function buildSalesBook(txns: LedgerTxn[]) {
  const rows = [...txns]
    .filter((txn) => txn.type !== 'ADVANCE')
    .sort((a, b) => a.time.localeCompare(b.time));
  const sum = (pick: (txn: LedgerTxn) => number) =>
    round2(rows.reduce((total, txn) => total + pick(txn), 0));

  return {
    rows,
    vat: sum((txn) => txn.vat),
    total: sum((txn) => txn.total),
    taxable: sum((txn) => txn.taxable),
    payerShare: sum((txn) => txn.payerShare),
    patientShare: sum((txn) => (txn.type === 'INVOICE' ? txn.total - txn.payerShare : txn.total)),
  };
}
