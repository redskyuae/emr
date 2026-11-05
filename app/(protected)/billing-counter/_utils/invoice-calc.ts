import { round2 } from './money';
import type { BillTo, ChargeItem, InvoiceLine, LedgerLine } from './counter-types';

export type CalculatedLine = LedgerLine & { key: string };

export function newInvoiceLine(item: ChargeItem, hasPayer: boolean): InvoiceLine {
  return {
    quantity: 1,
    discountPercent: 0,
    code: item.code,
    vatRate: item.vatRate,
    unitPrice: item.unitPrice,
    description: item.description,
    key: `${item.code}-${Math.random().toString(36).slice(2, 8)}`,
    billTo: hasPayer && item.coverable ? 'PAYER' : 'PATIENT',
  };
}

export function calculateLine(line: InvoiceLine): CalculatedLine {
  const gross = round2(line.quantity * line.unitPrice);
  const discount = round2((gross * line.discountPercent) / 100);
  const taxable = round2(gross - discount);
  const vat = round2((taxable * line.vatRate) / 100);

  return {
    vat,
    taxable,
    key: line.key,
    code: line.code,
    billTo: line.billTo,
    vatRate: line.vatRate,
    quantity: line.quantity,
    discount,
    discountPercent: line.discountPercent,
    unitPrice: line.unitPrice,
    total: round2(taxable + vat),
    description: line.description,
  };
}

export function calculateInvoice(lines: InvoiceLine[]) {
  const calculated = lines.map(calculateLine);
  const sum = (pick: (line: CalculatedLine) => number, billTo?: BillTo) =>
    round2(
      calculated
        .filter((line) => !billTo || line.billTo === billTo)
        .reduce((total, line) => total + pick(line), 0)
    );

  return {
    lines: calculated,
    vat: sum((line) => line.vat),
    total: sum((line) => line.total),
    taxable: sum((line) => line.taxable),
    discount: sum((line) => line.discount),
    gross: sum((line) => line.quantity * line.unitPrice),
    payerShare: sum((line) => line.total, 'PAYER'),
    patientShare: sum((line) => line.total, 'PATIENT'),
  };
}

// A discount above this percentage on any line needs a supervisor's approval.
export const DISCOUNT_APPROVAL_THRESHOLD_PERCENT = 10;

export function largestDiscountPercent(lines: InvoiceLine[]) {
  return lines.reduce((largest, line) => Math.max(largest, line.discountPercent), 0);
}

export function validateDiscount({
  lines,
  reason,
  approvedBy,
}: {
  lines: InvoiceLine[];
  reason: string;
  approvedBy: string;
}) {
  const errors: string[] = [];
  const largest = largestDiscountPercent(lines);

  if (largest > 0 && !reason.trim()) {
    errors.push('Give a reason for the discount.');
  }

  if (largest > DISCOUNT_APPROVAL_THRESHOLD_PERCENT && !approvedBy) {
    errors.push(
      `A discount above ${DISCOUNT_APPROVAL_THRESHOLD_PERCENT}% needs supervisor approval.`
    );
  }

  return errors;
}

export function validatePayerAuth({
  payerShare,
  authNumber,
}: {
  payerShare: number;
  authNumber: string;
}) {
  return payerShare > 0 && !authNumber.trim()
    ? ['Enter the insurer approval number for the insured lines.']
    : [];
}

export function validateInvoiceLines(lines: InvoiceLine[]) {
  const errors: string[] = [];

  if (lines.length === 0) {
    errors.push('Add at least one charge.');
  }

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      errors.push(`${line.description}: quantity must be a whole number of at least 1.`);
    }

    if (!(line.discountPercent >= 0 && line.discountPercent <= 100)) {
      errors.push(`${line.description}: discount must be between 0% and 100%.`);
    }
  }

  return errors;
}
