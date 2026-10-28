export type BillTo = 'PATIENT' | 'PAYER';
export type TxnType = 'INVOICE' | 'ADVANCE' | 'CREDIT_NOTE';
export type TenderMethod = 'CASH' | 'CARD' | 'CHEQUE' | 'BANK_TRANSFER' | 'GOOGLE_PAY' | 'ADVANCE';

export type ChargeItem = {
  code: string;
  vatRate: number;
  unitPrice: number;
  coverable: boolean;
  description: string;
  cpt: string | null;
  category: 'Consultation' | 'Investigation' | 'Therapy' | 'Pharmacy' | 'Wellness';
};

export type CounterVisit = {
  number: string;
  label: string;
};

export type CounterPatient = {
  mrn: string;
  name: string;
  phone: string;
  payer: string | null;
  visits: CounterVisit[];
  advanceBalance: number;
  category: 'Resident' | 'Tourist' | 'GCC National';
};

export type InvoiceLine = {
  key: string;
  code: string;
  quantity: number;
  vatRate: number;
  billTo: BillTo;
  discount: number;
  unitPrice: number;
  description: string;
};

export type TenderInput = {
  key: string;
  bank: string;
  amount: number;
  tendered: number;
  reference: string;
  method: TenderMethod;
};

export type ResolvedTender = {
  bank: string;
  amount: number;
  change: number;
  reference: string;
  method: TenderMethod;
  tendered: number | null;
};

export type LedgerLine = {
  code: string;
  vat: number;
  total: number;
  billTo: BillTo;
  taxable: number;
  vatRate: number;
  discount: number;
  quantity: number;
  unitPrice: number;
  description: string;
};

export type LedgerTxn = {
  id: string;
  vat: number;
  time: string;
  total: number;
  taxable: number;
  type: TxnType;
  number: string;
  shiftNo: number;
  patientMrn: string;
  payerShare: number;
  patientName: string;
  outstanding: number;
  /** Signed: a Credit Note is negative. */
  patientPaid: number;
  description: string;
  lines: LedgerLine[];
  approvedBy: string | null;
  tenders: ResolvedTender[];
  reason: string | null;
  /** Credit Notes name what they settle, e.g. "Advance balance" or an Invoice Number. */
  against: string | null;
  /** Invoice Number a Credit Note refunds; null when it refunds the Advance balance. */
  refundOfInvoice: string | null;
  visitNumber: string | null;
  receiptNumber: string | null;
};

export type ClosingFigures = {
  closedAt: string;
  cashCounted: number;
  cardBatchTotal: number;
  cashVariance: number;
  cardDifference: number;
  expectedCash: number;
  closedBy: string;
  retainedFloat: number;
  depositToSafe: number;
  varianceReason: string | null;
  varianceApprovedBy: string | null;
};

export type ShiftState = {
  no: number;
  counter: string;
  cashier: string;
  openedAt: string;
  openingFloat: number;
  authorizedBy: string | null;
  status: 'OPEN' | 'CLOSED';
  closing: ClosingFigures | null;
  openingBasis: 'DEFAULT' | 'AUTHORIZED';
};

export type CounterState = {
  shift: ShiftState;
  ledger: LedgerTxn[];
  closedShifts: { shift: ShiftState; txnCount: number }[];
  sequences: { inv: number; adv: number; cn: number; rcp: number };
  advanceBalances: Record<string, number>;
};
