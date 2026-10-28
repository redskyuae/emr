import { describe, expect, it } from 'vitest';

import { CHARGE_ITEMS } from '../_data/counter-seed';
import { splitVatInclusive } from './money';
import { calculateInvoice, newInvoiceLine, validateInvoiceLines } from './invoice-calc';

function line(code: string, quantity = 1, hasPayer = false) {
  const item = CHARGE_ITEMS.find((candidate) => candidate.code === code)!;
  return { ...newInvoiceLine(item, hasPayer), quantity };
}

describe('calculateInvoice', () => {
  it('should match the cashier screen for Abhyanga, Elakizhi and Triphala', () => {
    const totals = calculateInvoice([line('ABH'), line('KIZ'), line('MED2', 2)]);

    expect(totals.taxable).toBe(840);
    expect(totals.vat).toBe(36.5);
    expect(totals.total).toBe(876.5);
  });

  it('should not charge VAT on a registered medicine', () => {
    const [medicine] = calculateInvoice([line('MED2', 2)]).lines;

    expect(medicine.vat).toBe(0);
    expect(medicine.total).toBe(110);
  });

  it('should take the discount off before VAT', () => {
    const discounted = { ...line('ABH'), discount: 50 };
    const totals = calculateInvoice([discounted]);

    expect(totals.gross).toBe(350);
    expect(totals.discount).toBe(50);
    expect(totals.taxable).toBe(300);
    expect(totals.vat).toBe(15);
    expect(totals.total).toBe(315);
  });

  it('should split patient and payer shares by line', () => {
    const consultation = line('99213', 1, true);
    const therapy = line('ABH', 1, true);
    const totals = calculateInvoice([consultation, therapy]);

    expect(consultation.billTo).toBe('PAYER');
    expect(therapy.billTo).toBe('PATIENT');
    expect(totals.payerShare).toBe(189);
    expect(totals.patientShare).toBe(367.5);
    expect(totals.payerShare + totals.patientShare).toBe(totals.total);
  });
});

describe('validateInvoiceLines', () => {
  it('should require at least one charge', () => {
    expect(validateInvoiceLines([])).toEqual(['Add at least one charge.']);
  });

  it('should reject a discount larger than the line', () => {
    const errors = validateInvoiceLines([{ ...line('ABH'), discount: 400 }]);

    expect(errors).toEqual(['Abhyanga, 60 min: discount must be between 0 and the line amount.']);
  });

  it('should reject a fractional or zero quantity', () => {
    expect(validateInvoiceLines([{ ...line('ABH'), quantity: 0 }])).toHaveLength(1);
    expect(validateInvoiceLines([{ ...line('ABH'), quantity: 1.5 }])).toHaveLength(1);
  });
});

describe('splitVatInclusive', () => {
  it('should reproduce the credit note split of a 4,000 advance refund', () => {
    expect(splitVatInclusive(4000, 5)).toEqual({ net: 3809.52, vat: 190.48 });
  });
});
