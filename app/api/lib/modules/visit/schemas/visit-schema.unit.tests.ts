import { describe, expect, it } from 'vitest';

import {
  cancelVisitSchema,
  createVisitSchema,
  updateVisitSchema,
  visitIdSchema,
  visitListParamsSchema,
  visitTenantIdSchema,
} from './visit-schema';

const errorsOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validCreate = { patientId: 1, appointmentTypeId: 2 };

describe('Visit schema', () => {
  it('should return validation error when patient ID is missing', () => {
    expect(
      errorsOf(createVisitSchema.safeParse({ ...validCreate, patientId: undefined }))
    ).toContain('Visit patient ID is required');
  });

  it('should return validation error when appointment type ID is missing', () => {
    expect(
      errorsOf(createVisitSchema.safeParse({ ...validCreate, appointmentTypeId: undefined }))
    ).toContain('Visit appointment type ID is required');
  });

  it('should accept optional doctor ID and appointment reason ID', () => {
    const result = createVisitSchema.safeParse({
      ...validCreate,
      doctorId: 5,
      appointmentReasonId: 7,
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ doctorId: 5, appointmentReasonId: 7 });
  });

  it('should treat empty-string optional ids as absent', () => {
    const result = createVisitSchema.safeParse({
      ...validCreate,
      doctorId: '',
      appointmentReasonId: null,
    });
    expect(result.success).toBe(true);
    expect(result.data?.doctorId).toBeUndefined();
    expect(result.data?.appointmentReasonId).toBeUndefined();
  });

  it('should trim chief complaint and notes, dropping empty strings', () => {
    const result = createVisitSchema.parse({
      ...validCreate,
      chiefComplaint: '  Fever  ',
      notes: '   ',
    });
    expect(result.chiefComplaint).toBe('Fever');
    expect(result.notes).toBeUndefined();
  });

  it('should reject chief complaint exceeding max length', () => {
    expect(
      errorsOf(createVisitSchema.safeParse({ ...validCreate, chiefComplaint: 'a'.repeat(501) }))
    ).toContain('Visit chief complaint must be at most 500 characters');
  });

  it('should require appointment type ID on update but not patient ID', () => {
    const result = updateVisitSchema.safeParse({ appointmentTypeId: 2 });
    expect(result.success).toBe(true);
  });

  it('should require a non-empty cancelled reason on cancel', () => {
    expect(errorsOf(cancelVisitSchema.safeParse({ cancelledReason: '' }))).toContain(
      'Visit cancelled reason cannot be empty'
    );
  });

  it('should accept an optional status id on cancel', () => {
    const result = cancelVisitSchema.safeParse({ cancelledReason: 'Patient left', statusId: 3 });
    expect(result).toMatchObject({
      success: true,
      data: { cancelledReason: 'Patient left', statusId: 3 },
    });
  });

  it('should validate visit id is positive integer', () => {
    expect(visitIdSchema.safeParse('1').success).toBe(true);
    expect(visitIdSchema.safeParse('0').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(visitTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(visitTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should validate list params and reject an invalid status category', () => {
    expect(visitListParamsSchema.safeParse({ tenantId: 'tenant-1' }).success).toBe(true);
    expect(
      visitListParamsSchema.safeParse({ tenantId: 'tenant-1', statusCategory: 'UNKNOWN' }).success
    ).toBe(false);
    expect(
      visitListParamsSchema.safeParse({ tenantId: 'tenant-1', statusCategory: 'WAITING' }).success
    ).toBe(true);
  });
});
