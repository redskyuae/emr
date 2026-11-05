import { round2 } from './money';
import type { ResolvedTender, TenderInput, TenderMethod } from './counter-types';

/** Where the money physically lands, which decides how Day close reconciles it. */
export type TenderGroup = 'DRAWER' | 'CARD' | 'BANK' | 'OTHER' | 'ADVANCE';

export type TenderFieldKey =
  'reference' | 'bank' | 'last4' | 'network' | 'cardType' | 'chequeDate' | 'upiId' | 'note';

export type TenderField = {
  key: TenderFieldKey;
  label: string;
  required: boolean;
  kind: 'text' | 'select' | 'date' | 'digits';
  options?: string[];
  maxLength?: number;
  placeholder?: string;
};

type TenderMeta = {
  label: string;
  group: TenderGroup;
  fields: TenderField[];
};

export const TENDER_META: Record<TenderMethod, TenderMeta> = {
  CASH: { label: 'Cash', group: 'DRAWER', fields: [] },
  CARD: {
    label: 'Card',
    group: 'CARD',
    fields: [
      {
        key: 'cardType',
        label: 'Card type',
        required: false,
        kind: 'select',
        options: ['Debit', 'Credit'],
      },
      {
        key: 'network',
        label: 'Network',
        required: false,
        kind: 'select',
        options: ['Visa', 'Mastercard', 'American Express', 'Other'],
      },
      {
        key: 'last4',
        label: 'Last 4 digits',
        required: true,
        kind: 'digits',
        maxLength: 4,
        placeholder: '1234',
      },
      { key: 'reference', label: 'Approval code', required: true, kind: 'text' },
    ],
  },
  UPI: {
    label: 'UPI',
    group: 'BANK',
    fields: [
      {
        key: 'upiId',
        label: 'UPI ID (VPA)',
        required: false,
        kind: 'text',
        placeholder: 'name@bank',
      },
      { key: 'reference', label: 'UTR / transaction ID', required: true, kind: 'text' },
    ],
  },
  GOOGLE_PAY: {
    label: 'Google Pay',
    group: 'BANK',
    fields: [{ key: 'reference', label: 'Transaction ID', required: true, kind: 'text' }],
  },
  BANK_TRANSFER: {
    label: 'Bank transfer',
    group: 'BANK',
    fields: [
      { key: 'reference', label: 'Transfer reference', required: true, kind: 'text' },
      { key: 'bank', label: 'Remitting bank', required: false, kind: 'text' },
    ],
  },
  CHEQUE: {
    label: 'Cheque',
    group: 'BANK',
    fields: [
      { key: 'reference', label: 'Cheque number', required: true, kind: 'text' },
      { key: 'bank', label: 'Drawee bank', required: true, kind: 'text' },
      { key: 'chequeDate', label: 'Cheque date', required: true, kind: 'date' },
    ],
  },
  OTHER: {
    label: 'Other',
    group: 'OTHER',
    fields: [
      {
        key: 'note',
        label: 'Payment description',
        required: true,
        kind: 'text',
        placeholder: 'e.g. gift voucher',
      },
      { key: 'reference', label: 'Reference', required: false, kind: 'text' },
    ],
  },
  ADVANCE: { label: 'Advance', group: 'ADVANCE', fields: [] },
};

/** Methods a cashier can take money with, in the order they are offered. */
export const COLLECTION_METHODS: TenderMethod[] = [
  'CASH',
  'CARD',
  'UPI',
  'GOOGLE_PAY',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER',
];

const ALL_METHODS = Object.keys(TENDER_META) as TenderMethod[];

export function methodsInGroup(group: TenderGroup) {
  return ALL_METHODS.filter((method) => TENDER_META[method].group === group);
}

const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export function tenderFieldValue(tender: TenderInput | ResolvedTender, key: TenderFieldKey) {
  if (key === 'reference') {
    return tender.reference;
  }

  if (key === 'bank') {
    return tender.bank;
  }

  return tender.details[key] ?? '';
}

export function withTenderField(
  tender: TenderInput,
  key: TenderFieldKey,
  value: string
): TenderInput {
  if (key === 'reference' || key === 'bank') {
    return { ...tender, [key]: value };
  }

  return { ...tender, details: { ...tender.details, [key]: value } };
}

/** One-line description of the instrument for books and receipts. */
export function describeTender(tender: ResolvedTender) {
  const { details } = tender;
  const parts: (string | false)[] = [];

  switch (tender.method) {
    case 'CARD':
      parts.push(
        details.network,
        details.cardType,
        details.last4 && `••${details.last4}`,
        tender.reference && `approval ${tender.reference}`
      );
      break;
    case 'UPI':
      parts.push(details.upiId, tender.reference && `UTR ${tender.reference}`);
      break;
    case 'CHEQUE':
      parts.push(tender.reference && `no. ${tender.reference}`, tender.bank, details.chequeDate);
      break;
    case 'BANK_TRANSFER':
      parts.push(tender.reference, tender.bank);
      break;
    case 'OTHER':
      parts.push(details.note, tender.reference);
      break;
    default:
      parts.push(tender.reference);
  }

  return parts.filter(Boolean).join(' · ');
}

/** What a refund back to the original instrument needs to quote. */
export function refundReferenceLabel(method: TenderMethod) {
  switch (method) {
    case 'CARD':
      return 'Original card approval code';
    case 'UPI':
    case 'GOOGLE_PAY':
      return 'Refund transaction ID';
    default:
      return 'Transfer reference';
  }
}

/** Advance is drawn down first; it never exceeds the balance or the amount due. */
export function autoAdvanceAmount(advanceBalance: number, due: number) {
  return Math.max(0, round2(Math.min(advanceBalance, due)));
}

export function newTender(method: TenderMethod): TenderInput {
  return {
    method,
    bank: '',
    amount: 0,
    details: {},
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
        details: Object.fromEntries(
          Object.entries(tender.details)
            .map(([key, value]) => [key, value.trim()])
            .filter(([, value]) => value)
        ),
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
      details: {},
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

function validateTenderFields(tender: TenderInput) {
  const meta = TENDER_META[tender.method];
  const errors: string[] = [];

  for (const field of meta.fields) {
    const value = tenderFieldValue(tender, field.key).trim();

    if (field.required && !value) {
      errors.push(`${meta.label}: enter the ${field.label.toLowerCase()}.`);
    }
  }

  const last4 = tenderFieldValue(tender, 'last4').trim();

  if (last4 && !/^\d{4}$/.test(last4)) {
    errors.push('Card: the last 4 digits must be four numbers.');
  }

  const upiId = tenderFieldValue(tender, 'upiId').trim();

  if (upiId && !UPI_ID_PATTERN.test(upiId)) {
    errors.push('UPI: the UPI ID must look like name@bank.');
  }

  return errors;
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

    errors.push(...validateTenderFields(tender));
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
    errors.push('Non-cash and advance amounts cannot exceed the amount due.');
  }

  if (remaining > 0 && !allowOutstanding) {
    errors.push(`AED ${remaining.toFixed(2)} still to collect, or mark it as outstanding.`);
  }

  return { errors, resolved, paid, remaining, change, advanceUsed };
}
