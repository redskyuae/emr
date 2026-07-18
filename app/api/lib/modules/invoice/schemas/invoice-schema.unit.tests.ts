import { describe, expect, it } from 'vitest';

import {
  addInvoiceLineSchema,
  createInvoiceSchema,
  invoiceIdSchema,
  recordPaymentSchema,
  roundMoney,
  updateDraftInvoiceSchema,
  voidInvoiceSchema,
} from './invoice-schema';

const errorsOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Invoice schema', () => {
  describe('roundMoney', () => {
    it('should round to two decimal places half-up', () => {
      expect(roundMoney(199.999)).toBe(200);
      expect(roundMoney(0.005)).toBe(0.01);
      expect(roundMoney(2.5 * 3)).toBe(7.5);
    });
  });

  describe('createInvoiceSchema', () => {
    it('should require a patient id', () => {
      expect(errorsOf(createInvoiceSchema.safeParse({}))).toContain('Patient ID is required');
    });

    it('should accept a patient with no encounter link', () => {
      expect(createInvoiceSchema.parse({ patientId: 7 })).toMatchObject({ patientId: 7 });
    });

    it('should accept a visit link', () => {
      expect(createInvoiceSchema.parse({ patientId: 7, visitId: 3 })).toMatchObject({
        visitId: 3,
      });
    });

    it('should reject linking to both a visit and an admission', () => {
      expect(
        errorsOf(createInvoiceSchema.safeParse({ patientId: 7, visitId: 3, admissionId: 9 }))
      ).toContain('An Invoice can link to a Visit or an Admission, not both.');
    });

    it('should treat empty encounter fields as absent', () => {
      expect(createInvoiceSchema.parse({ patientId: 7, visitId: '', admissionId: null })).toEqual({
        patientId: 7,
        visitId: undefined,
        admissionId: undefined,
        notes: undefined,
      });
    });
  });

  describe('addInvoiceLineSchema', () => {
    it('should require a charge item id and a quantity of at least 1', () => {
      expect(errorsOf(addInvoiceLineSchema.safeParse({ quantity: 0 }))).toContain(
        'Charge item ID is required'
      );
      expect(errorsOf(addInvoiceLineSchema.safeParse({ chargeItemId: 1, quantity: 0 }))).toContain(
        'Quantity must be at least 1'
      );
    });

    it('should keep an optional price override rounded, and omit it when blank', () => {
      expect(
        addInvoiceLineSchema.parse({ chargeItemId: 1, quantity: 2, unitPrice: '10.005' })
      ).toMatchObject({
        unitPrice: 10.01,
      });
      expect(
        addInvoiceLineSchema.parse({ chargeItemId: 1, quantity: 2, unitPrice: '' })
      ).toMatchObject({
        unitPrice: undefined,
      });
    });
  });

  describe('updateDraftInvoiceSchema', () => {
    it('should default discount to zero and reject a negative discount', () => {
      expect(updateDraftInvoiceSchema.parse({}).discountAmount).toBe(0);
      expect(errorsOf(updateDraftInvoiceSchema.safeParse({ discountAmount: -5 }))).toContain(
        'Discount must be zero or more'
      );
    });
  });

  describe('voidInvoiceSchema', () => {
    it('should require a non-empty void reason', () => {
      expect(errorsOf(voidInvoiceSchema.safeParse({}))).toContain('Void reason is required');
      expect(errorsOf(voidInvoiceSchema.safeParse({ voidReason: '   ' }))).toContain(
        'Void reason cannot be empty'
      );
    });
  });

  describe('recordPaymentSchema', () => {
    it('should require a positive amount and a valid method', () => {
      expect(errorsOf(recordPaymentSchema.safeParse({ method: 'CASH' }))).toContain(
        'Payment amount is required'
      );
      expect(errorsOf(recordPaymentSchema.safeParse({ amount: 0, method: 'CASH' }))).toContain(
        'Payment amount must be greater than zero'
      );
      expect(errorsOf(recordPaymentSchema.safeParse({ amount: 100, method: 'BITCOIN' }))).toContain(
        'Payment method must be one of CASH, CARD, UPI, BANK_TRANSFER, CHEQUE, OTHER'
      );
    });

    it('should reject a future received date', () => {
      const future = new Date(Date.now() + 86_400_000).toISOString();
      expect(
        errorsOf(recordPaymentSchema.safeParse({ amount: 100, method: 'CASH', receivedAt: future }))
      ).toContain('Received date cannot be in the future');
    });

    it('should accept a valid payment and coerce the amount', () => {
      expect(recordPaymentSchema.parse({ amount: '250.5', method: 'UPI' })).toMatchObject({
        amount: 250.5,
        method: 'UPI',
      });
    });
  });

  describe('invoiceIdSchema', () => {
    it('should reject non-positive and non-numeric ids', () => {
      expect(invoiceIdSchema.safeParse('0').success).toBe(false);
      expect(invoiceIdSchema.safeParse('abc').success).toBe(false);
      expect(invoiceIdSchema.parse('7')).toBe(7);
    });
  });
});
