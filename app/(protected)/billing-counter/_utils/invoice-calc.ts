import { round2 } from './money';
import type { BillTo, ChargeItem, InvoiceLine, LedgerLine } from './counter-types';

export type CalculatedLine = LedgerLine & { key: string };

export function newInvoiceLine(item: ChargeItem, hasPayer: boolean): InvoiceLine {
  return {
    quantity: 1,
    discount: 0,
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
  const taxable = round2(gross - line.discount);
  const vat = round2((taxable * line.vatRate) / 100);

  return {
    vat,
    taxable,
    key: line.key,
    code: line.code,
    billTo: line.billTo,
    vatRate: line.vatRate,
    quantity: line.quantity,
    discount: line.discount,
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

export function validateInvoiceLines(lines: InvoiceLine[]) {
  const errors: string[] = [];

  if (lines.length === 0) {
    errors.push('Add at least one charge.');
  }

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      errors.push(`${line.description}: quantity must be a whole number of at least 1.`);
    }

    if (line.discount < 0 || line.discount > round2(line.quantity * line.unitPrice)) {
      errors.push(`${line.description}: discount must be between 0 and the line amount.`);
    }
  }

  return errors;
}
