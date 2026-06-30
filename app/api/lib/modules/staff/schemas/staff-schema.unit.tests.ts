import { describe, expect, it } from 'vitest';

import { createStaffSchema, staffUserIdSchema, updateStaffSchema } from './staff-schema';

const createErrors = (result: ReturnType<typeof createStaffSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];
const updateErrors = (result: ReturnType<typeof updateStaffSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validCreate = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'supersecret',
  roleIds: [1],
};

describe('Staff schema', () => {
  it('should require name, email, password and role ids', () => {
    const errors = createErrors(createStaffSchema.safeParse({}));
    expect(errors).toEqual(
      expect.arrayContaining(['Name is required', 'Email is required', 'Password is required'])
    );
  });

  it('should reject an invalid email', () => {
    expect(createErrors(createStaffSchema.safeParse({ ...validCreate, email: 'nope' }))).toContain(
      'Email must be valid'
    );
  });

  it('should reject a short password', () => {
    expect(
      createErrors(createStaffSchema.safeParse({ ...validCreate, password: 'short' }))
    ).toContain('Password must be at least 8 characters');
  });

  it('should require at least one role id', () => {
    expect(createErrors(createStaffSchema.safeParse({ ...validCreate, roleIds: [] }))).toContain(
      'At least one Role ID is required'
    );
  });

  it('should reject an invalid gender', () => {
    expect(
      createErrors(createStaffSchema.safeParse({ ...validCreate, gender: 'Robot' }))
    ).toContain('Gender is invalid');
  });

  it('should reject a future date of birth', () => {
    expect(
      createErrors(createStaffSchema.safeParse({ ...validCreate, dateOfBirth: '3000-01-01' }))
    ).toContain('Date of birth must be in the past');
  });

  it('should reject a malformed date of birth', () => {
    expect(
      createErrors(createStaffSchema.safeParse({ ...validCreate, dateOfBirth: '01-01-2000' }))
    ).toContain('Date of birth must be a valid date');
  });

  it('should accept a valid create payload and drop blank optionals', () => {
    const result = createStaffSchema.safeParse({ ...validCreate, phone: '   ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.roleIds).toEqual([1]);
    }
  });

  it('should require at least one field on update', () => {
    expect(updateErrors(updateStaffSchema.safeParse({}))).toContain(
      'At least one staff field is required'
    );
  });

  it('should reject unknown keys on update (strict)', () => {
    expect(updateStaffSchema.safeParse({ name: 'Asha', email: 'x@y.com' }).success).toBe(false);
  });

  it('should coerce a blank nullable field to null on update', () => {
    expect(updateStaffSchema.parse({ staffCode: '   ' })).toEqual({ staffCode: null });
  });

  it('should validate the staff user id', () => {
    expect(staffUserIdSchema.safeParse('user-1').success).toBe(true);
    expect(staffUserIdSchema.safeParse('   ').success).toBe(false);
  });
});
