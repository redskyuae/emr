import { describe, expect, it } from 'vitest';

import {
  assignRolePermissionsSchema,
  rolePermissionIdsSchema,
  setRolePermissionsSchema,
} from './role-permission-schema';

describe('RolePermission schema', () => {
  it('should accept an array of permission ids', () => {
    expect(rolePermissionIdsSchema.safeParse({ permissionIds: [1, 2] })).toMatchObject({
      success: true,
      data: { permissionIds: [1, 2] },
    });
  });

  it('should reject unknown keys (strict)', () => {
    expect(rolePermissionIdsSchema.safeParse({ permissionIds: [1], extra: true }).success).toBe(
      false
    );
  });

  it('should require at least one permission id when assigning', () => {
    const result = assignRolePermissionsSchema.safeParse({ permissionIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'At least one Permission ID is required'
      );
    }
  });

  it('should allow an empty array when setting permissions', () => {
    expect(setRolePermissionsSchema.safeParse({ permissionIds: [] }).success).toBe(true);
  });

  it('should reject a non-positive permission id', () => {
    expect(assignRolePermissionsSchema.safeParse({ permissionIds: [0] }).success).toBe(false);
  });
});
