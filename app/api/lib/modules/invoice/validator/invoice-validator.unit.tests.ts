import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionRepository } from '@/app/api/lib/modules/admission/repository/admission-repository';
import { chargeItemRepository } from '@/app/api/lib/modules/charge-item/repository/charge-item-repository';
import { patientRepository } from '@/app/api/lib/modules/patient/repository/patient-repository';
import { visitRepository } from '@/app/api/lib/modules/visit/repository/visit-repository';
import { invoiceRepository } from '../repository/invoice-repository';
import { validateAddInvoiceLine } from './add-invoice-line-validator';
import { validateCreateInvoice } from './create-invoice-validator';
import { validateDeleteInvoice } from './delete-invoice-validator';
import { validateFinalizeInvoice } from './finalize-invoice-validator';
import { validateGenerateBedCharges } from './generate-bed-charges-validator';
import { validateGetInvoices } from './get-invoices-validator';
import { validateRecordPayment } from './record-payment-validator';
import { validateUpdateDraftInvoice } from './update-draft-invoice-validator';
import { validateVoidInvoice } from './void-invoice-validator';

vi.mock('../repository/invoice-repository', () => ({
  invoiceRepository: { findInvoiceById: vi.fn(), getInvoiceById: vi.fn() },
}));
vi.mock('@/app/api/lib/modules/patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('@/app/api/lib/modules/visit/repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('@/app/api/lib/modules/admission/repository/admission-repository', () => ({
  admissionRepository: { getAdmissionById: vi.fn() },
}));
vi.mock('@/app/api/lib/modules/charge-item/repository/charge-item-repository', () => ({
  chargeItemRepository: { getChargeItemById: vi.fn() },
}));

const invoiceRepo = vi.mocked(invoiceRepository);
const patientRepo = vi.mocked(patientRepository);
const visitRepo = vi.mocked(visitRepository);
const admissionRepo = vi.mocked(admissionRepository);
const chargeItemRepo = vi.mocked(chargeItemRepository);

const draftInvoice = {
  id: 1,
  invoiceNumber: 'INV-1001',
  status: 'DRAFT' as const,
  patientId: 7,
  visitId: null,
  admissionId: null,
  subtotal: 1000,
  discountAmount: 0,
  grandTotal: 1000,
  amountPaid: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  patientRepo.getPatientById.mockResolvedValue({ id: 7, mrn: 'MRN-0007' } as never);
  invoiceRepo.findInvoiceById.mockResolvedValue(draftInvoice);
});

describe('Invoice validators', () => {
  describe('validateCreateInvoice', () => {
    it('should reject when the patient does not exist', async () => {
      patientRepo.getPatientById.mockResolvedValue(undefined);

      const result = await validateCreateInvoice({ patientId: 7 }, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Patient 7 is Invalid.'] });
    });

    it('should reject a visit that belongs to another patient', async () => {
      visitRepo.getVisitById.mockResolvedValue({
        id: 3,
        visitNumber: 'V-1001',
        patient: { id: 99 },
      } as never);

      const result = await validateCreateInvoice({ patientId: 7, visitId: 3 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Visit V-1001 does not belong to patient MRN-0007.'],
      });
    });

    it('should reject an admission that belongs to another patient', async () => {
      admissionRepo.getAdmissionById.mockResolvedValue({
        id: 9,
        admissionNumber: 'ADM-1001',
        patient: { id: 99 },
      } as never);

      const result = await validateCreateInvoice({ patientId: 7, admissionId: 9 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Admission ADM-1001 does not belong to patient MRN-0007.'],
      });
    });

    it('should accept a valid patient-only invoice', async () => {
      const result = await validateCreateInvoice({ patientId: 7 }, 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { patientId: 7 } });
    });
  });

  describe('validateAddInvoiceLine', () => {
    it('should reject an invalid invoice id without loading anything', async () => {
      const result = await validateAddInvoiceLine(
        'abc',
        { chargeItemId: 1, quantity: 1 },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: false, errors: ['Invoice abc is Invalid.'] });
      expect(invoiceRepo.findInvoiceById).not.toHaveBeenCalled();
    });

    it('should reject editing a non-draft invoice', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, status: 'FINALIZED' });

      const result = await validateAddInvoiceLine(
        '1',
        { chargeItemId: 1, quantity: 1 },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 can only be edited while in Draft.'],
      });
    });

    it('should reject an inactive charge item', async () => {
      chargeItemRepo.getChargeItemById.mockResolvedValue({
        id: 1,
        code: 'CONS',
        name: 'Consultation',
        unitPrice: 500,
        isActive: false,
      } as never);

      const result = await validateAddInvoiceLine(
        '1',
        { chargeItemId: 1, quantity: 1 },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Charge item CONS is inactive.'],
      });
    });

    it('should snapshot the charge item name and price when no override is given', async () => {
      chargeItemRepo.getChargeItemById.mockResolvedValue({
        id: 1,
        code: 'CONS',
        name: 'Consultation',
        unitPrice: 500,
        isActive: true,
      } as never);

      const result = await validateAddInvoiceLine(
        '1',
        { chargeItemId: 1, quantity: 2 },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: true,
        data: { invoiceId: 1, description: 'Consultation', quantity: 2, unitPrice: 500 },
      });
    });

    it('should honour a price override', async () => {
      chargeItemRepo.getChargeItemById.mockResolvedValue({
        id: 1,
        code: 'CONS',
        name: 'Consultation',
        unitPrice: 500,
        isActive: true,
      } as never);

      const result = await validateAddInvoiceLine(
        '1',
        { chargeItemId: 1, quantity: 1, unitPrice: 250 },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: true, data: { unitPrice: 250 } });
    });
  });

  describe('validateUpdateDraftInvoice', () => {
    it('should reject a discount larger than the subtotal', async () => {
      const result = await validateUpdateDraftInvoice('1', { discountAmount: 6000 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Discount 6000 exceeds the invoice subtotal 1000.'],
      });
    });

    it('should reject editing a non-draft invoice', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, status: 'PAID' });

      const result = await validateUpdateDraftInvoice('1', { discountAmount: 0 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 can only be edited while in Draft.'],
      });
    });
  });

  describe('validateFinalizeInvoice', () => {
    it('should reject finalizing an invoice with no lines', async () => {
      invoiceRepo.getInvoiceById.mockResolvedValue({
        ...draftInvoice,
        lines: [],
      } as never);

      const result = await validateFinalizeInvoice('1', 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 has no lines to finalize.'],
      });
    });

    it('should accept a draft with at least one line', async () => {
      invoiceRepo.getInvoiceById.mockResolvedValue({
        ...draftInvoice,
        lines: [{ id: 1 }],
      } as never);

      const result = await validateFinalizeInvoice('1', 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { id: 1 } });
    });
  });

  describe('validateVoidInvoice', () => {
    it('should reject voiding an invoice that carries payments', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({
        ...draftInvoice,
        status: 'PARTIALLY_PAID',
        amountPaid: 100,
      });

      const result = await validateVoidInvoice('1', { voidReason: 'Mistake' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 cannot be voided after payments are recorded.'],
      });
    });

    it('should accept voiding an unpaid finalized invoice', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, status: 'FINALIZED' });

      const result = await validateVoidInvoice('1', { voidReason: 'Duplicate' }, 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { id: 1, voidReason: 'Duplicate' } });
    });
  });

  describe('validateRecordPayment', () => {
    it('should reject payment on an invoice that is not open for payment', async () => {
      const result = await validateRecordPayment('1', { amount: 100, method: 'CASH' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 is not open for payment.'],
      });
    });

    it('should reject a payment exceeding the balance due', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({
        ...draftInvoice,
        status: 'FINALIZED',
        grandTotal: 1000,
        amountPaid: 700,
      });

      const result = await validateRecordPayment('1', { amount: 500, method: 'CASH' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Payment amount 500 exceeds the balance due 300 on invoice INV-1001.'],
      });
    });

    it('should accept a payment within the balance due', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({
        ...draftInvoice,
        status: 'FINALIZED',
        grandTotal: 1000,
        amountPaid: 0,
      });

      const result = await validateRecordPayment('1', { amount: 400, method: 'UPI' }, 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { invoiceId: 1 } });
    });
  });

  describe('validateGenerateBedCharges', () => {
    it('should reject an invoice not linked to an admission', async () => {
      const result = await validateGenerateBedCharges('1', 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 is not linked to an Admission.'],
      });
    });

    it('should reject when the linked admission is not discharged', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, admissionId: 9 });
      admissionRepo.getAdmissionById.mockResolvedValue({
        id: 9,
        admissionNumber: 'ADM-1001',
        status: 'ADMITTED',
      } as never);

      const result = await validateGenerateBedCharges('1', 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Admission ADM-1001 is not discharged yet.'],
      });
    });

    it('should accept a draft admission invoice for a discharged admission', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, admissionId: 9 });
      admissionRepo.getAdmissionById.mockResolvedValue({
        id: 9,
        admissionNumber: 'ADM-1001',
        status: 'DISCHARGED',
      } as never);

      const result = await validateGenerateBedCharges('1', 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { invoiceId: 1, admissionId: 9 } });
    });
  });

  describe('validateDeleteInvoice', () => {
    it('should reject deleting a finalized invoice', async () => {
      invoiceRepo.findInvoiceById.mockResolvedValue({ ...draftInvoice, status: 'FINALIZED' });

      const result = await validateDeleteInvoice('1', 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Invoice INV-1001 cannot be removed once finalized.'],
      });
    });

    it('should accept deleting a draft invoice', async () => {
      const result = await validateDeleteInvoice('1', 'tenant-1');

      expect(result).toMatchObject({ success: true, data: { id: 1 } });
    });
  });

  describe('validateGetInvoices', () => {
    it('should reject an unknown status filter', () => {
      expect(validateGetInvoices('tenant-1', 'ARCHIVED')).toMatchObject({
        success: false,
        errors: ['Invoice status ARCHIVED is Invalid.'],
      });
    });

    it('should parse a comma-separated status set', () => {
      expect(validateGetInvoices('tenant-1', 'DRAFT,FINALIZED')).toEqual({
        success: true,
        data: { tenantId: 'tenant-1', statuses: ['DRAFT', 'FINALIZED'] },
      });
    });

    it('should treat a blank status as no filter', () => {
      expect(validateGetInvoices('tenant-1', '')).toEqual({
        success: true,
        data: { tenantId: 'tenant-1' },
      });
    });
  });
});
