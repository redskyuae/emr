import { describe, expect, it } from 'vitest';

import {
  chargeItemIdSchema,
  chargeItemTenantIdSchema,
  createChargeItemSchema,
  updateChargeItemSchema,
} from './charge-item-schema';

const errorsOf = (result: ReturnType<typeof createChargeItemSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validPayload = {
  name: 'General Consultation',
  code: 'CONS',
  category: 'CONSULTATION',
  unitPrice: 500,
};

describe('ChargeItem schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, name: undefined }))
    ).toContain('Charge item name is required');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, code: undefined }))
    ).toContain('Charge item code is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(errorsOf(createChargeItemSchema.safeParse({ ...validPayload, name: '   ' }))).toContain(
      'Charge item name cannot be empty'
    );
  });

  it('should return validation error when name exceeds 150 characters', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, name: 'a'.repeat(151) }))
    ).toContain('Charge item name must be at most 150 characters');
  });

  it('should return validation error when code exceeds 20 characters', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, code: 'a'.repeat(21) }))
    ).toContain('Charge item code must be at most 20 characters');
  });

  it('should return validation error when category is not a known value', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, category: 'SURGERY' }))
    ).toContain(
      'Charge item category must be one of CONSULTATION, PROCEDURE, INVESTIGATION, BED, CONSUMABLE, OTHER'
    );
  });

  it('should return validation error when unit price is missing', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, unitPrice: undefined }))
    ).toContain('Charge item unit price is required');
  });

  it('should return validation error when unit price is negative', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, unitPrice: -1 }))
    ).toContain('Charge item unit price must be zero or more');
  });

  it('should reject a blank or null unit price as required, not coerce it to zero', () => {
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, unitPrice: '' }))
    ).toContain('Charge item unit price is required');
    expect(
      errorsOf(createChargeItemSchema.safeParse({ ...validPayload, unitPrice: null }))
    ).toContain('Charge item unit price is required');
  });

  it('should uppercase code and trim name on successful parse', () => {
    expect(
      createChargeItemSchema.parse({
        ...validPayload,
        name: ' General Consultation ',
        code: ' cons ',
      })
    ).toMatchObject({ name: 'General Consultation', code: 'CONS' });
  });

  it('should coerce a numeric string unit price and round to two decimals', () => {
    expect(createChargeItemSchema.parse({ ...validPayload, unitPrice: '199.999' }).unitPrice).toBe(
      200
    );
  });

  it('should default isActive to true when omitted', () => {
    expect(createChargeItemSchema.parse(validPayload).isActive).toBe(true);
  });

  it('should transform blank description to undefined', () => {
    expect(
      createChargeItemSchema.parse({ ...validPayload, description: '   ' }).description
    ).toBeUndefined();
  });

  it('should keep a provided description', () => {
    expect(
      createChargeItemSchema.parse({ ...validPayload, description: ' Standard OPD fee ' })
        .description
    ).toBe('Standard OPD fee');
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateChargeItemSchema.parse({ ...validPayload, code: 'cons' })).toMatchObject({
      code: 'CONS',
    });
  });

  it('should leave isActive undefined on update when omitted, unlike create which defaults it', () => {
    expect(updateChargeItemSchema.parse(validPayload).isActive).toBeUndefined();
    expect(createChargeItemSchema.parse(validPayload).isActive).toBe(true);
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(chargeItemIdSchema.safeParse('0').success).toBe(false);
    expect(chargeItemIdSchema.safeParse('abc').success).toBe(false);
    expect(chargeItemIdSchema.parse('7')).toBe(7);
    expect(chargeItemTenantIdSchema.safeParse('   ').success).toBe(false);
    expect(chargeItemTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
  });
});
