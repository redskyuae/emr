import { TENDER_META } from './tender';
import type { LedgerTxn, TxnType } from './counter-types';

export const TXN_TYPE_LABEL: Record<TxnType, string> = {
  INVOICE: 'Invoice',
  ADVANCE: 'Advance',
  CREDIT_NOTE: 'Credit note',
};

export const TXN_TYPE_CLASS: Record<TxnType, string> = {
  INVOICE: 'border-primary/40 text-primary',
  ADVANCE: 'border-procedure/40 text-procedure',
  CREDIT_NOTE: 'border-destructive/40 text-destructive',
};

export function tenderSummary(txn: LedgerTxn) {
  return txn.tenders.map((tender) => ({
    key: `${tender.method}-${tender.reference}-${tender.amount}`,
    label: TENDER_META[tender.method].label,
    amount: tender.amount,
  }));
}
