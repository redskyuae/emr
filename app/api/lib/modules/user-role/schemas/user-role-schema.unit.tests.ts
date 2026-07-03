import { describe, expect, it } from 'vitest';

import { assignUserRolesSchema } from './user-role-schema';

describe('UserRole schema', () => {
  it('should accept an array of role ids', () => {
    expect(assignUserRolesSchema.safeParse({ roleIds: [1, 2] })).toMatchObject({
      success: true,
      data: { roleIds: [1, 2] },
    });
  });

  it('should require at least one role id', () => {
    const result = assignUserRolesSchema.safeParse({ roleIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'At least one Role ID is required'
      );
    }
  });

  it('should reject unknown keys (strict)', () => {
    expect(assignUserRolesSchema.safeParse({ roleIds: [1], extra: true }).success).toBe(false);
  });

  it('should reject a non-positive role id', () => {
    expect(assignUserRolesSchema.safeParse({ roleIds: [0] }).success).toBe(false);
  });
});
