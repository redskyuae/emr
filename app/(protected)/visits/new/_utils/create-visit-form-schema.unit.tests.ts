import { describe, expect, it } from 'vitest';

import { createVisitFormSchema } from './create-visit-form-schema';

const base = {
  mode: 'appointment' as const,
  appointmentId: '12',
  patientId: '',
  doctorId: '',
  visitTypeId: '3',
  chiefComplaint: '',
  remarks: '',
  createInvoice: false,
  paymentClassification: 'SELF_PAY' as const,
  insurer: '',
  policyReference: '',
  chargeItemId: '',
  chargeAmount: '',
  amountReceived: '0',
  paymentMethod: 'CASH' as const,
  paymentReference: '',
};

describe('createVisitFormSchema', () => {
  it('accepts an Appointment whose Doctor is already assigned', () => {
    expect(createVisitFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires an Appointment for an Appointment Visit', () => {
    const result = createVisitFormSchema.safeParse({ ...base, appointmentId: '' });
    expect(result.success).toBe(false);
  });

  it('requires Patient, Doctor, and Visit type for a Walk-in Visit', () => {
    const result = createVisitFormSchema.safeParse({
      ...base,
      mode: 'walk-in',
      appointmentId: '',
      visitTypeId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['patientId', 'doctorId', 'visitTypeId'])
      );
    }
  });

  it('requires a priced Charge Item when creating an Invoice at Check-in', () => {
    const result = createVisitFormSchema.safeParse({ ...base, createInvoice: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['chargeItemId', 'chargeAmount'])
      );
    }
  });

  it('accepts a partial Payment and rejects an amount above the charge', () => {
    const valid = {
      ...base,
      createInvoice: true,
      chargeItemId: '7',
      chargeAmount: '500.00',
      amountReceived: '250.00',
    };
    expect(createVisitFormSchema.safeParse(valid).success).toBe(true);
    const excess = createVisitFormSchema.safeParse({ ...valid, amountReceived: '500.01' });
    expect(excess.success).toBe(false);
  });

  it('rejects sub-cent amounts at Check-in', () => {
    const result = createVisitFormSchema.safeParse({
      ...base,
      createInvoice: true,
      chargeItemId: '7',
      chargeAmount: '1.001',
      amountReceived: '0',
    });
    expect(result.success).toBe(false);
  });

  it('allows a blank received amount for a deferred Payment', () => {
    expect(
      createVisitFormSchema.safeParse({
        ...base,
        createInvoice: true,
        chargeItemId: '7',
        chargeAmount: '500',
        amountReceived: '',
      }).success
    ).toBe(true);
  });

  it('does not validate hidden billing details when Invoice creation is off', () => {
    expect(
      createVisitFormSchema.safeParse({
        ...base,
        insurer: 'x'.repeat(151),
        policyReference: 'x'.repeat(101),
        paymentReference: 'x'.repeat(101),
      }).success
    ).toBe(true);
  });

  it('limits reimbursement and Payment reference fields when they are recorded', () => {
    const result = createVisitFormSchema.safeParse({
      ...base,
      createInvoice: true,
      paymentClassification: 'REIMBURSEMENT',
      insurer: 'x'.repeat(151),
      policyReference: 'x'.repeat(101),
      chargeItemId: '7',
      chargeAmount: '500',
      amountReceived: '100',
      paymentReference: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['insurer', 'policyReference', 'paymentReference'])
      );
    }
  });
});
