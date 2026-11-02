import type { PaymentMethod } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';

export type ComposerLine = {
  key: string;
  chargeItemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ComposerTender = {
  key: string;
  method: PaymentMethod;
  amount: string;
  reference: string;
};

export function roundAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function invoiceComposerTotals(lines: ComposerLine[], discount: number) {
  const subtotal = roundAmount(
    lines.reduce((sum, line) => sum + roundAmount(line.quantity * roundAmount(line.unitPrice)), 0)
  );
  return { subtotal, grandTotal: roundAmount(Math.max(0, subtotal - discount)) };
}

export function resolveComposerTenders(tenders: ComposerTender[], due: number) {
  const errors: string[] = [];
  const resolved = tenders.map((tender) => {
    const amount = Number(tender.amount);
    if (
      !tender.amount ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      roundAmount(amount) !== amount
    ) {
      errors.push(
        `${tender.method} amount must be greater than zero and use at most two decimals.`
      );
    }
    if (tender.reference.trim().length > 100) {
      errors.push(`${tender.method} reference must be at most 100 characters.`);
    }
    return { ...tender, amount: Number.isFinite(amount) ? roundAmount(amount) : 0 };
  });
  const paid = roundAmount(resolved.reduce((sum, tender) => sum + tender.amount, 0));
  if (paid > due) errors.push('Payments cannot exceed the Invoice total.');
  return { resolved, paid, remaining: roundAmount(Math.max(0, due - paid)), errors };
}
