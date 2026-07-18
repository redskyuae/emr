import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import { invoiceRepository } from '../repository/invoice-repository';
import { validateAddInvoiceLine } from '../validator/add-invoice-line-validator';
import { validateCreateInvoice } from '../validator/create-invoice-validator';
import { validateFinalizeInvoice } from '../validator/finalize-invoice-validator';
import { validateGenerateBedCharges } from '../validator/generate-bed-charges-validator';
import { validateRecordPayment } from '../validator/record-payment-validator';
import { validateVoidInvoice } from '../validator/void-invoice-validator';
import { addInvoiceLineCommand } from './add-invoice-line-command';
import { createInvoiceCommand } from './create-invoice-command';
import { finalizeInvoiceCommand } from './finalize-invoice-command';
import { generateBedChargesCommand } from './generate-bed-charges-command';
import { recordPaymentCommand } from './record-payment-command';
import { voidInvoiceCommand } from './void-invoice-command';

vi.mock('../repository/invoice-repository', () => ({
  invoiceRepository: {
    createInvoice: vi.fn(),
    addInvoiceLine: vi.fn(),
    finalizeInvoice: vi.fn(),
    voidInvoice: vi.fn(),
    recordPayment: vi.fn(),
    getOccupancySource: vi.fn(),
    replaceBedAutoLines: vi.fn(),
  },
}));
vi.mock('../validator/create-invoice-validator', () => ({ validateCreateInvoice: vi.fn() }));
vi.mock('../validator/add-invoice-line-validator', () => ({ validateAddInvoiceLine: vi.fn() }));
vi.mock('../validator/finalize-invoice-validator', () => ({ validateFinalizeInvoice: vi.fn() }));
vi.mock('../validator/void-invoice-validator', () => ({ validateVoidInvoice: vi.fn() }));
vi.mock('../validator/record-payment-validator', () => ({ validateRecordPayment: vi.fn() }));
vi.mock('../validator/generate-bed-charges-validator', () => ({
  validateGenerateBedCharges: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const repo = vi.mocked(invoiceRepository);
const validateCreate = vi.mocked(validateCreateInvoice);
const validateAddLine = vi.mocked(validateAddInvoiceLine);
const validateFinalize = vi.mocked(validateFinalizeInvoice);
const validateVoid = vi.mocked(validateVoidInvoice);
const validatePayment = vi.mocked(validateRecordPayment);
const validateBedCharges = vi.mocked(validateGenerateBedCharges);
const tenantRepo = vi.mocked(tenantRepository);

const invoice = { id: 1, invoiceNumber: 'INV-1001', status: 'DRAFT' } as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Invoice commands', () => {
  describe('createInvoiceCommand', () => {
    it('should not write when validation fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['bad'] });

      const result = await createInvoiceCommand({}, 'tenant-1');

      expect(result).toMatchObject({ success: false });
      expect(repo.createInvoice).not.toHaveBeenCalled();
    });

    it('should map an invoice-number 23505 race to a conflict', async () => {
      validateCreate.mockResolvedValue({ success: true, data: { patientId: 7 } as never });
      repo.createInvoice.mockRejectedValue({
        cause: { code: '23505', constraint: 'invoice_tenant_number_idx' },
      });

      const result = await createInvoiceCommand({}, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Invoice Number allocation conflicted. Please retry.'],
      });
    });

    it('should return the created invoice on success', async () => {
      validateCreate.mockResolvedValue({ success: true, data: { patientId: 7 } as never });
      repo.createInvoice.mockResolvedValue(invoice);

      await expect(createInvoiceCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: invoice,
      });
    });
  });

  describe('addInvoiceLineCommand', () => {
    beforeEach(() => {
      validateAddLine.mockResolvedValue({
        success: true,
        data: { invoiceId: 1, chargeItemId: 2, description: 'X', quantity: 1, unitPrice: 100 },
      });
    });

    it('should map a not-draft outcome to a conflict', async () => {
      repo.addInvoiceLine.mockResolvedValue({ outcome: 'not-draft', data: invoice });

      const result = await addInvoiceLineCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Invoice INV-1001 can only be edited while in Draft.'],
      });
    });

    it('should return the updated invoice on success', async () => {
      repo.addInvoiceLine.mockResolvedValue({ outcome: 'updated', data: invoice });

      await expect(addInvoiceLineCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: invoice,
      });
    });

    it('should map an amount-too-large outcome to a clean conflict', async () => {
      repo.addInvoiceLine.mockResolvedValue({ outcome: 'amount-too-large' });

      const result = await addInvoiceLineCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Invoice total would exceed the maximum allowed amount.'],
      });
    });
  });

  describe('finalizeInvoiceCommand', () => {
    it('should map a not-found outcome to 404', async () => {
      validateFinalize.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
      repo.finalizeInvoice.mockResolvedValue({ outcome: 'not-found' });

      await expect(finalizeInvoiceCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the finalized invoice on success', async () => {
      validateFinalize.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
      repo.finalizeInvoice.mockResolvedValue({ outcome: 'finalized', data: invoice });

      await expect(finalizeInvoiceCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: invoice,
      });
    });

    it('should map the repository race-guard no-lines outcome to the same conflict as the validator check', async () => {
      validateFinalize.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
      repo.finalizeInvoice.mockResolvedValue({ outcome: 'no-lines', data: invoice });

      await expect(finalizeInvoiceCommand('1', 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Invoice INV-1001 has no lines to finalize.'],
      });
    });
  });

  describe('voidInvoiceCommand', () => {
    it('should map a not-voidable outcome to a conflict', async () => {
      validateVoid.mockResolvedValue({ success: true, data: { id: 1, voidReason: 'x' } });
      repo.voidInvoice.mockResolvedValue({ outcome: 'not-voidable', data: invoice });

      await expect(voidInvoiceCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Invoice INV-1001 cannot be voided after payments are recorded.'],
      });
    });
  });

  describe('recordPaymentCommand', () => {
    beforeEach(() => {
      validatePayment.mockResolvedValue({
        success: true,
        data: { invoiceId: 1, payload: { amount: 500, method: 'CASH' } as never },
      });
    });

    it('should map an over-balance outcome to a conflict with the balance', async () => {
      repo.recordPayment.mockResolvedValue({
        outcome: 'over-balance',
        data: { id: 1, invoiceNumber: 'INV-1001', grandTotal: 1000, amountPaid: 700 } as never,
      });

      const result = await recordPaymentCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({
        success: false,
        errors: ['Payment amount 500 exceeds the balance due 300 on invoice INV-1001.'],
      });
    });

    it('should return the invoice and receipt on success', async () => {
      const payment = { id: 1, receiptNumber: 'RCP-1001' } as never;
      repo.recordPayment.mockResolvedValue({ outcome: 'recorded', data: invoice, payment });

      await expect(recordPaymentCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: { invoice, payment },
      });
    });

    it('should map a receipt-number 23505 race to a clean conflict', async () => {
      repo.recordPayment.mockRejectedValue({
        cause: { code: '23505', constraint: 'payment_tenant_receipt_idx' },
      });

      await expect(recordPaymentCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Receipt Number allocation conflicted. Please retry.'],
      });
    });

    it('should rethrow unrelated repository errors', async () => {
      const error = new Error('database down');
      repo.recordPayment.mockRejectedValue(error);

      await expect(recordPaymentCommand('1', 'tenant-1', {})).rejects.toThrow(error);
    });
  });

  describe('generateBedChargesCommand', () => {
    beforeEach(() => {
      validateBedCharges.mockResolvedValue({
        success: true,
        data: { invoiceId: 1, admissionId: 9, tenantId: 'tenant-1' },
      });
      tenantRepo.getTenantById.mockResolvedValue({ timeZone: 'Asia/Kolkata' } as never);
    });

    it('should price each occupancy segment and skip beds with no rate', async () => {
      repo.getOccupancySource.mockResolvedValue({
        admittedAt: new Date('2026-03-10T04:00:00Z'),
        dischargedAt: new Date('2026-03-13T04:00:00Z'),
        status: 'DISCHARGED',
        currentBedId: 5,
        transfers: [{ fromBedId: 4, toBedId: 5, transferredAt: new Date('2026-03-11T04:00:00Z') }],
        beds: [
          { bedId: 4, bedNumber: 'ICU-01', wardCode: 'ICU', dailyRate: null },
          { bedId: 5, bedNumber: 'ICU-02', wardCode: 'ICU', dailyRate: 5000 },
        ],
      });
      repo.replaceBedAutoLines.mockResolvedValue({ outcome: 'updated', data: invoice });

      const result = await generateBedChargesCommand('1', 'tenant-1');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.linesAdded).toBe(1);
      expect(result.data.warnings).toEqual([
        'Bed ICU-01 has no daily rate configured; segment skipped.',
      ]);
      expect(repo.replaceBedAutoLines).toHaveBeenCalledWith('tenant-1', 1, [
        expect.objectContaining({ quantity: 2, unitPrice: 5000, amount: 10000 }),
      ]);
    });

    it("should price segments using the Tenant's configured time zone, not the Asia/Kolkata default", async () => {
      // This span straddles midnight differently depending on the interpreting
      // zone: UTC counts 2 calendar days, Asia/Kolkata (+5:30) counts only 1.
      // A day count of 2 here only appears if the Tenant's actual "UTC" setting
      // reached the calculator instead of the module's Kolkata default.
      repo.getOccupancySource.mockResolvedValue({
        admittedAt: new Date('2026-03-10T22:00:00Z'),
        dischargedAt: new Date('2026-03-12T01:00:00Z'),
        status: 'DISCHARGED',
        currentBedId: 5,
        transfers: [],
        beds: [{ bedId: 5, bedNumber: 'GEN-01', wardCode: 'GEN', dailyRate: 1000 }],
      });
      repo.replaceBedAutoLines.mockResolvedValue({ outcome: 'updated', data: invoice });
      tenantRepo.getTenantById.mockResolvedValue({ timeZone: 'UTC' } as never);

      await generateBedChargesCommand('1', 'tenant-1');

      expect(tenantRepo.getTenantById).toHaveBeenCalledWith('tenant-1');
      expect(repo.replaceBedAutoLines).toHaveBeenCalledWith('tenant-1', 1, [
        expect.objectContaining({ quantity: 2, unitPrice: 1000, amount: 2000 }),
      ]);
    });

    it('should fall back to the default time zone when the Tenant cannot be read', async () => {
      repo.getOccupancySource.mockResolvedValue({
        admittedAt: new Date('2026-03-10T22:00:00Z'),
        dischargedAt: new Date('2026-03-12T01:00:00Z'),
        status: 'DISCHARGED',
        currentBedId: 5,
        transfers: [],
        beds: [{ bedId: 5, bedNumber: 'GEN-01', wardCode: 'GEN', dailyRate: 1000 }],
      });
      repo.replaceBedAutoLines.mockResolvedValue({ outcome: 'updated', data: invoice });
      tenantRepo.getTenantById.mockResolvedValue(undefined);

      await generateBedChargesCommand('1', 'tenant-1');

      expect(repo.replaceBedAutoLines).toHaveBeenCalledWith('tenant-1', 1, [
        expect.objectContaining({ quantity: 1 }),
      ]);
    });

    it('should skip and warn on a segment whose amount would exceed the numeric(12,2) column max', async () => {
      // 101 days at the Room Type's own max daily rate (99,999,999.99) overflows
      // numeric(12,2) even though the rate itself is a valid, in-range value.
      repo.getOccupancySource.mockResolvedValue({
        admittedAt: new Date('2026-01-01T04:00:00Z'),
        dischargedAt: new Date('2026-04-12T04:00:00Z'),
        status: 'DISCHARGED',
        currentBedId: 5,
        transfers: [],
        beds: [{ bedId: 5, bedNumber: 'ICU-01', wardCode: 'ICU', dailyRate: 99_999_999.99 }],
      });
      repo.replaceBedAutoLines.mockResolvedValue({ outcome: 'updated', data: invoice });

      const result = await generateBedChargesCommand('1', 'tenant-1');

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.linesAdded).toBe(0);
      expect(result.data.warnings).toEqual([
        'Bed ICU-01 charge for 101 days exceeds the maximum allowed amount; segment skipped.',
      ]);
      expect(repo.replaceBedAutoLines).toHaveBeenCalledWith('tenant-1', 1, []);
    });
  });
});
