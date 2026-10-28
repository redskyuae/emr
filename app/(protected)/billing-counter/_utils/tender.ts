import { round2 } from './money';
import type { ResolvedTender, TenderInput, TenderMethod } from './counter-types';

type TenderMeta = {
  label: string;
  /** Money lands in the drawer, not at the bank. */
  isCash: boolean;
  referenceLabel: string | null;
};

export const TENDER_META: Record<TenderMethod, TenderMeta> = {
  CASH: { label: 'Cash', isCash: true, referenceLabel: null },
  CARD: { label: 'Card', isCash: false, referenceLabel: 'Approval code' },
  CHEQUE: { label: 'Cheque', isCash: false, referenceLabel: 'Cheque number' },
  BANK_TRANSFER: { label: 'Bank transfer', isCash: false, referenceLabel: 'Transfer reference' },
  GOOGLE_PAY: { label: 'Google Pay', isCash: false, referenceLabel: 'Transaction ID' },
  ADVANCE: { label: 'Advance', isCash: false, referenceLabel: null },
};

export const COLLECTION_METHODS: TenderMethod[] = [
  'CASH',
  'CARD',
  'CHEQUE',
  'BANK_TRANSFER',
  'GOOGLE_PAY',
];

export function newTender(method: TenderMethod): TenderInput {
  return {
    method,
    bank: '',
    amount: 0,
    tendered: 0,
    reference: '',
    key: `${method}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

/**
 * Cash is applied last: it only covers what the other tenders leave, and any
 * excess handed over is returned as change. Only the applied amount is posted.
 */
export function resolveTenders(tenders: TenderInput[], due: number) {
  const nonCashTotal = round2(
    tenders.filter((tender) => tender.method !== 'CASH').reduce((sum, t) => sum + t.amount, 0)
  );
  let cashRoom = Math.max(0, round2(due - nonCashTotal));

  const resolved: ResolvedTender[] = tenders.map((tender) => {
    if (tender.method !== 'CASH') {
      return {
        change: 0,
        tendered: null,
        bank: tender.bank.trim(),
        amount: round2(tender.amount),
        method: tender.method,
        reference: tender.reference.trim(),
      };
    }

    const applied = Math.min(tender.tendered, cashRoom);
    cashRoom = round2(cashRoom - applied);

    return {
      bank: '',
      reference: '',
      method: 'CASH',
      amount: round2(applied),
      tendered: round2(tender.tendered),
      change: round2(tender.tendered - applied),
    };
  });

  const paid = round2(resolved.reduce((sum, tender) => sum + tender.amount, 0));

  return {
    resolved,
    paid,
    remaining: Math.max(0, round2(due - paid)),
    change: round2(resolved.reduce((sum, tender) => sum + tender.change, 0)),
  };
}

export function validateTenders({
  due,
  tenders,
  advanceBalance,
  allowOutstanding,
}: {
  due: number;
  tenders: TenderInput[];
  advanceBalance: number;
  allowOutstanding: boolean;
}) {
  const errors: string[] = [];
  const { resolved, paid, remaining, change } = resolveTenders(tenders, due);

  for (const tender of tenders) {
    const meta = TENDER_META[tender.method];

    if (tender.method === 'CASH' ? tender.tendered <= 0 : tender.amount <= 0) {
      errors.push(`Enter the ${meta.label.toLowerCase()} amount.`);
    }

    if (meta.referenceLabel && !tender.reference.trim()) {
      errors.push(`${meta.label}: enter the ${meta.referenceLabel.toLowerCase()}.`);
    }

    if (tender.method === 'CHEQUE' && !tender.bank.trim()) {
      errors.push('Cheque: enter the drawee bank.');
    }
  }

  const advanceUsed = round2(
    resolved.filter((tender) => tender.method === 'ADVANCE').reduce((s, t) => s + t.amount, 0)
  );

  if (advanceUsed > advanceBalance) {
    errors.push(`Advance used exceeds the available balance of AED ${advanceBalance.toFixed(2)}.`);
  }

  const nonCashTotal = round2(
    tenders.filter((tender) => tender.method !== 'CASH').reduce((s, t) => s + t.amount, 0)
  );

  if (nonCashTotal > due) {
    errors.push(
      'Card, transfer, cheque, Google Pay and advance amounts cannot exceed the amount due.'
    );
  }

  if (remaining > 0 && !allowOutstanding) {
    errors.push(`AED ${remaining.toFixed(2)} still to collect, or mark it as outstanding.`);
  }

  return { errors, resolved, paid, remaining, change, advanceUsed };
}
