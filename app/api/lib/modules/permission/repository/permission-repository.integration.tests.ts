import { describe, expect, it } from 'vitest';

import { deactivatePermission } from '@/test/helpers';

import { permissionSeedData } from '../seed-data';
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
    // Ordering should follow the seed catalogue's own definition order, not insertion id.
    expect(permissions.map((p) => p.name)).toEqual(permissionSeedData.map((p) => p.name));
  });

  it('should seed Doctor and Specialty permissions in their Permission Modules', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const doctorAndSpecialtyPermissions = permissions
      .filter(({ resource }) => resource === 'doctor' || resource === 'specialty')
      .map(({ name, module, resource, action, description }) => ({
        name,
        module,
        resource,
        action,
        description,
      }));

    expect(doctorAndSpecialtyPermissions).toEqual([
      {
        name: 'doctor:read',
        module: 'identity-access',
        resource: 'doctor',
        action: 'read',
        description: 'View Doctors.',
      },
      {
        name: 'doctor:create',
        module: 'identity-access',
        resource: 'doctor',
        action: 'create',
        description: 'Create Doctors.',
      },
      {
        name: 'doctor:update',
        module: 'identity-access',
        resource: 'doctor',
        action: 'update',
        description: 'Update Doctor details.',
      },
      {
        name: 'doctor:deactivate',
        module: 'identity-access',
        resource: 'doctor',
        action: 'deactivate',
        description: 'Deactivate Doctor access.',
      },
      {
        name: 'doctor:reactivate',
        module: 'identity-access',
        resource: 'doctor',
        action: 'reactivate',
        description: 'Reactivate Doctor access.',
      },
      {
        name: 'specialty:read',
        module: 'clinical-masters',
        resource: 'specialty',
        action: 'read',
        description: 'View Specialties.',
      },
      {
        name: 'specialty:create',
        module: 'clinical-masters',
        resource: 'specialty',
        action: 'create',
        description: 'Create Specialties.',
      },
      {
        name: 'specialty:update',
        module: 'clinical-masters',
        resource: 'specialty',
        action: 'update',
        description: 'Update Specialties.',
      },
      {
        name: 'specialty:delete',
        module: 'clinical-masters',
        resource: 'specialty',
        action: 'delete',
        description: 'Delete Specialties.',
      },
    ]);
  });

  it('should not return inactive permissions', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const firstPermission = permissions[0];
    if (!firstPermission) {
      throw new Error('No permissions found after seeding');
    }

    await deactivatePermission(firstPermission.id);

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
    const firstPermission = permissionsBefore[0];
    if (!firstPermission) {
      throw new Error('No permissions found after seeding');
    }

    // Force a value to drift from the seed catalogue so re-seeding must update it back.
    await deactivatePermission(firstPermission.id);

    await permissionRepository.seedPermissionCatalogue();
    const permissionsAfter = await permissionRepository.getPermissions();

    // No duplicate rows were created...
    expect(permissionsAfter.length).toBe(countBefore);
    // ...and the drifted value was corrected back to match the catalogue.
    await expect(permissionRepository.getPermissionById(firstPermission.id)).resolves.toMatchObject(
      { isActive: true }
    );
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
