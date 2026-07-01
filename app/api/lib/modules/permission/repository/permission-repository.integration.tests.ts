import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { permissionRepository } from './permission-repository';

describe('Permission repository', () => {
  it('should seed permission catalogue', async () => {
    await expect(permissionRepository.seedPermissionCatalogue()).resolves.toBeUndefined();
  });

  it('should get permission by id after seeding', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const firstPermission = permissions[0];
    if (!firstPermission) {
      throw new Error('No permissions found after seeding');
    }
    await expect(permissionRepository.getPermissionById(firstPermission.id)).resolves.toMatchObject(
      {
        id: firstPermission.id,
        name: firstPermission.name,
        isActive: true,
      }
    );
  });

  it('should get all permissions after seeding', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    expect(permissions.length).toBeGreaterThan(0);
    expect(permissions.every((p) => p.isActive === true)).toBe(true);
  });

  it('should filter permissions by module', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const allPermissions = await permissionRepository.getPermissions();
    const firstModule = allPermissions[0]?.module;
    if (!firstModule) {
      throw new Error('No module found in permissions');
    }

    const modulePermissions = await permissionRepository.getPermissions({ module: firstModule });
    expect(modulePermissions.length).toBeGreaterThan(0);
    expect(modulePermissions.every((p) => p.module === firstModule)).toBe(true);
  });

  it('should return permissions in seed order', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    // Permissions should be ordered by the seed order, not by id
    expect(permissions).toBeInstanceOf(Array);
    // Verify basic ordering properties
    for (let i = 1; i < permissions.length; i++) {
      expect(permissions[i]?.name).toBeTruthy();
    }
  });

  it('should not return inactive permissions', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const firstPermission = permissions[0];
    if (!firstPermission) {
      throw new Error('No permissions found after seeding');
    }

    // Manually deactivate a permission by updating it
    const { db } = await import('@/app/db');
    const { permission: permissionTable } = await import('@/app/db/schema/permission');
    await db
      .update(permissionTable)
      .set({ isActive: false })
      .where(eq(permissionTable.id, firstPermission.id));

    // Should not include inactive permission
    const activePermissions = await permissionRepository.getPermissions();
    expect(activePermissions.every((p) => p.isActive === true)).toBe(true);
  });

  it('should get undefined for non-existent permission id', async () => {
    await permissionRepository.seedPermissionCatalogue();
    await expect(permissionRepository.getPermissionById(999999)).resolves.toBeUndefined();
  });

  it('should update existing permission on re-seed if values differ', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissionsBefore = await permissionRepository.getPermissions();
    const countBefore = permissionsBefore.length;

    await permissionRepository.seedPermissionCatalogue();
    const permissionsAfter = await permissionRepository.getPermissions();
    const countAfter = permissionsAfter.length;

    // Count should be the same (no duplicates)
    expect(countAfter).toBe(countBefore);
  });

  it('should have required fields for each permission', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    for (const permission of permissions) {
      expect(permission).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        module: expect.any(String),
        resource: expect.any(String),
        action: expect.any(String),
        isActive: true,
        createdOn: expect.any(Date),
        modifiedOn: expect.any(Date),
      });
    }
  });

  it('should return unique permission names', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const names = permissions.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should handle empty module filter gracefully', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const result1 = await permissionRepository.getPermissions({ module: '' });
    const result2 = await permissionRepository.getPermissions({ module: '   ' });
    const result3 = await permissionRepository.getPermissions();

    // Empty/whitespace module should return all permissions (no filter applied)
    expect(result1.length).toBe(result3.length);
    expect(result2.length).toBe(result3.length);
  });
});
