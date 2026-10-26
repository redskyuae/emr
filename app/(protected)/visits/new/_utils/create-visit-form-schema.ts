import { z } from 'zod';

import type { PaymentMethod } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { VISIT_CHARGE_OPTIONS } from './visit-charge-options';

const VISIT_CHARGE_KINDS = VISIT_CHARGE_OPTIONS.map((option) => option.value);

const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER',
] as const satisfies readonly PaymentMethod[];

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

function validateAmount(value: string, field: string, context: z.RefinementCtx) {
  const amount = Number(value);

  if (!moneyPattern.test(value) || !Number.isFinite(amount) || amount > 9_999_999_999) {
    context.addIssue({
      code: 'custom',
      path: [field],
      message: `${field === 'chargeAmount' ? 'Charge amount' : 'Amount received'} must be a valid amount with at most 2 decimal places.`,
    });
    return null;
  }

  return amount;
}

export const createVisitFormSchema = z
  .object({
    mode: z.enum(['appointment', 'walk-in']),
    appointmentId: z.string(),
    patientId: z.string(),
    doctorId: z.string(),
    visitTypeId: z.string().min(1, 'Visit type is required.'),
    chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters.'),
    remarks: z.string().trim(),
    createInvoice: z.boolean(),
    paymentTiming: z.enum(['NOW', 'LATER']),
    paymentClassification: z.enum(['SELF_PAY', 'REIMBURSEMENT']),
    insurer: z.string().trim(),
    policyReference: z.string().trim(),
    chargeKind: z.union([z.literal(''), z.enum(VISIT_CHARGE_KINDS)]),
    chargeItemId: z.string(),
    chargeAmount: z.string(),
    amountReceived: z.string(),
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentReference: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'appointment' && !values.appointmentId) {
      context.addIssue({
        code: 'custom',
        path: ['appointmentId'],
        message: 'Appointment is required.',
      });
    }
    if (values.mode === 'walk-in' && !values.patientId) {
      context.addIssue({ code: 'custom', path: ['patientId'], message: 'Patient is required.' });
    }
    if (values.mode === 'walk-in' && !values.doctorId) {
      context.addIssue({ code: 'custom', path: ['doctorId'], message: 'Doctor is required.' });
    }

    if (!values.createInvoice) return;

    if (values.paymentClassification === 'REIMBURSEMENT') {
      if (values.insurer.length > 150) {
        context.addIssue({
          code: 'custom',
          path: ['insurer'],
          message: 'Insurer must be at most 150 characters.',
        });
      }
      if (values.policyReference.length > 100) {
        context.addIssue({
          code: 'custom',
          path: ['policyReference'],
          message: 'Policy / Member Reference must be at most 100 characters.',
        });
      }
    }

    if (!values.chargeKind) {
      context.addIssue({
        code: 'custom',
        path: ['chargeKind'],
        message: 'Choose a Visit Charge Item.',
      });
    }

    if (!/^\d+$/.test(values.chargeItemId) || Number(values.chargeItemId) <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['chargeKind'],
        message: 'Set up the selected Charge Item in Billing Masters.',
      });
    }

    const charge = validateAmount(values.chargeAmount, 'chargeAmount', context);
    const received =
      values.paymentTiming === 'NOW'
        ? validateAmount(values.amountReceived, 'amountReceived', context)
        : 0;

    if (values.paymentTiming === 'NOW' && received === 0) {
      context.addIssue({
        code: 'custom',
        path: ['amountReceived'],
        message: 'Enter an amount greater than zero to collect Payment now.',
      });
    }

    if (received !== null && received > 0 && values.paymentReference.length > 100) {
      context.addIssue({
        code: 'custom',
        path: ['paymentReference'],
        message: 'Payment reference must be at most 100 characters.',
      });
    }

    if (charge !== null && received !== null && received > charge) {
      context.addIssue({
        code: 'custom',
        path: ['amountReceived'],
        message: 'Amount received cannot exceed the Visit charge.',
      });
    }
  });

export type CreateVisitFormValues = z.infer<typeof createVisitFormSchema>;
