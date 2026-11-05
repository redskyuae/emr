import { describe, expect, it } from 'vitest';

import { CHARGE_ITEMS } from '../_data/counter-seed';
import { splitVatInclusive } from './money';
import {
  calculateInvoice,
  largestDiscountPercent,
  newInvoiceLine,
  validateDiscount,
  validateInvoiceLines,
  validatePayerAuth,
} from './invoice-calc';

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

  it('should take the percentage discount off before VAT', () => {
    const discounted = { ...line('ABH'), discountPercent: 10 };
    const totals = calculateInvoice([discounted]);

    expect(totals.gross).toBe(350);
    expect(totals.discount).toBe(35);
    expect(totals.taxable).toBe(315);
    expect(totals.vat).toBe(15.75);
    expect(totals.total).toBe(330.75);
    expect(totals.lines[0].discountPercent).toBe(10);
  });

  it('should apply the percentage to quantity times unit price', () => {
    const totals = calculateInvoice([{ ...line('MED2', 2), discountPercent: 50 }]);

    expect(totals.discount).toBe(55);
    expect(totals.total).toBe(55);
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

  it('should reject a discount outside 0% to 100%', () => {
    expect(validateInvoiceLines([{ ...line('ABH'), discountPercent: 120 }])).toEqual([
      'Abhyanga, 60 min: discount must be between 0% and 100%.',
    ]);
    expect(validateInvoiceLines([{ ...line('ABH'), discountPercent: -5 }])).toHaveLength(1);
    expect(validateInvoiceLines([{ ...line('ABH'), discountPercent: 100 }])).toEqual([]);
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

describe('validateDiscount', () => {
  const approver = 'Reem Khalid (Branch Supervisor)';

  it('should need nothing when no line is discounted', () => {
    expect(validateDiscount({ lines: [line('ABH')], reason: '', approvedBy: '' })).toEqual([]);
  });

  it('should require a reason for any discount', () => {
    const lines = [{ ...line('ABH'), discountPercent: 5 }];

    expect(validateDiscount({ lines, reason: '', approvedBy: '' })).toEqual([
      'Give a reason for the discount.',
    ]);
    expect(validateDiscount({ lines, reason: 'Package rate', approvedBy: '' })).toEqual([]);
  });

  it('should require supervisor approval above 10% on any line', () => {
    const lines = [line('KIZ'), { ...line('ABH'), discountPercent: 12 }];

    expect(largestDiscountPercent(lines)).toBe(12);
    expect(validateDiscount({ lines, reason: 'Package rate', approvedBy: '' })).toEqual([
      'A discount above 10% needs supervisor approval.',
    ]);
    expect(validateDiscount({ lines, reason: 'Package rate', approvedBy: approver })).toEqual([]);
  });

  it('should not need approval at exactly 10%', () => {
    const lines = [{ ...line('ABH'), discountPercent: 10 }];

    expect(validateDiscount({ lines, reason: 'Loyalty', approvedBy: '' })).toEqual([]);
  });
});

describe('validatePayerAuth', () => {
  it('should require an approval number when the insurer is billed', () => {
    expect(validatePayerAuth({ payerShare: 189, authNumber: ' ' })).toEqual([
      'Enter the insurer approval number for the insured lines.',
    ]);
    expect(validatePayerAuth({ payerShare: 189, authNumber: 'DAN-AUTH-1' })).toEqual([]);
  });

  it('should not ask when nothing is billed to the insurer', () => {
    expect(validatePayerAuth({ payerShare: 0, authNumber: '' })).toEqual([]);
  });
});
