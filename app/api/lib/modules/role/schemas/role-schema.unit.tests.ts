import { describe, expect, it } from 'vitest';

import {
  createRoleSchema,
  roleIdSchema,
  roleTenantIdSchema,
  updateRoleSchema,
} from './role-schema';

const createErrors = (result: ReturnType<typeof createRoleSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];
const updateErrors = (result: ReturnType<typeof updateRoleSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Role schema', () => {
  it('should require name and code on create', () => {
    expect(createErrors(createRoleSchema.safeParse({}))).toEqual(
      expect.arrayContaining(['Role name is required', 'Role code is required'])
    );
  });

  it('should reject a code longer than 50 characters', () => {
    expect(
      createErrors(createRoleSchema.safeParse({ name: 'Manager', code: 'A'.repeat(51) }))
    ).toContain('Role code must be at most 50 characters');
  });

  it('should uppercase the code and drop empty description on create', () => {
    expect(
      createRoleSchema.parse({ name: ' Manager ', code: ' manager ', description: '  ' })
    ).toEqual({
      name: 'Manager',
      code: 'MANAGER',
    });
  });

  it('should reject unknown keys on create (strict)', () => {
    expect(createRoleSchema.safeParse({ name: 'Manager', code: 'MGR', extra: true }).success).toBe(
      false
    );
  });

  it('should require at least one field on update', () => {
    expect(updateErrors(updateRoleSchema.safeParse({}))).toContain(
      'At least one role field is required'
    );
  });

  it('should accept a name-only update', () => {
    expect(updateRoleSchema.safeParse({ name: 'Manager' })).toMatchObject({ success: true });
  });

  it('should coerce a blank description to null on update', () => {
    expect(updateRoleSchema.parse({ description: '   ' })).toEqual({ description: null });
  });

  it('should reject the immutable code field on update (strict)', () => {
    expect(updateRoleSchema.safeParse({ name: 'Manager', code: 'MGR' }).success).toBe(false);
  });

  it('should validate role id and tenant id', () => {
    expect(roleIdSchema.safeParse('1').success).toBe(true);
    expect(roleIdSchema.safeParse('0').success).toBe(false);
    expect(roleTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(roleTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
