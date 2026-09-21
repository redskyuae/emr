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

  it('should seed every Asset Management permission exposed by implemented APIs', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const assetResources = new Set([
      'asset',
      'asset-category',
      'asset-condition',
      'asset-status',
      'work-order',
      'work-order-priority',
      'work-order-status',
      'work-order-type',
    ]);
    const assetPermissions = permissions
      .filter(({ resource }) => assetResources.has(resource))
      .reduce<Record<string, { module: string; actions: string[] }>>(
        (groupedPermissions, { module, resource, action }) => ({
          ...groupedPermissions,
          [resource]: {
            module,
            actions: [...(groupedPermissions[resource]?.actions ?? []), action],
          },
        }),
        {}
      );

    expect(assetPermissions).toEqual({
      asset: {
        module: 'asset-management',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'asset-category': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'asset-condition': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'asset-status': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'work-order': {
        module: 'asset-management',
        actions: ['read', 'create'],
      },
      'work-order-priority': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'work-order-status': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'work-order-type': {
        module: 'asset-management-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
    });
  });

  it('should seed every unrepresented operational permission exposed by implemented APIs', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions();
    const operationalResources = new Set([
      'appointment',
      'doctor-rota',
      'doctor-schedule',
      'room',
      'room-type',
    ]);
    const operationalPermissions = permissions
      .filter(({ resource }) => operationalResources.has(resource))
      .reduce<Record<string, { module: string; actions: string[] }>>(
        (groupedPermissions, { module, resource, action }) => ({
          ...groupedPermissions,
          [resource]: {
            module,
            actions: [...(groupedPermissions[resource]?.actions ?? []), action],
          },
        }),
        {}
      );

    expect(operationalPermissions).toEqual({
      appointment: {
        module: 'appointments',
        actions: ['read', 'create'],
      },
      'doctor-rota': {
        module: 'doctor-scheduling',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'doctor-schedule': {
        module: 'doctor-scheduling',
        actions: ['read', 'create', 'update'],
      },
      room: {
        module: 'room-management',
        actions: ['read', 'create', 'update', 'delete'],
      },
      'room-type': {
        module: 'room-masters',
        actions: ['read', 'create', 'update', 'delete'],
      },
    });
  });

  it('should seed Patient Treatment Plan permissions in the appointments module', async () => {
    await permissionRepository.seedPermissionCatalogue();
    const permissions = await permissionRepository.getPermissions({ module: 'appointments' });

    expect(
      permissions
        .filter(({ resource }) => resource === 'patient-treatment-plan')
        .map(({ name, action, description }) => ({ name, action, description }))
    ).toEqual([
      {
        name: 'patient-treatment-plan:read',
        action: 'read',
        description: 'View Patient Treatment Plans and Sessions.',
      },
      {
        name: 'patient-treatment-plan:assign',
        action: 'assign',
        description: 'Assign Treatments to Patients and create Patient Treatment Plans.',
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
