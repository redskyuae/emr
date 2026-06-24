import type {
  GroupedPermissions,
  PermissionListItem,
} from '@/app/api/lib/modules/permission/schemas/permission-schema';

import type { PermissionSection } from '../_components/permission-matrix';

const moduleLabels: Record<string, string> = {
  'tenant-management': 'Tenant Management',
  'identity-access': 'Identity & Access',
  'appointment-masters': 'Appointment Masters',
  'global-references': 'Global References',
};

const actionLabels: Record<string, string> = {
  read: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  assign: 'Assign',
  replace: 'Replace',
  remove: 'Remove',
  revoke: 'Revoke',
};

function titleizeSlug(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function moduleLabel(module: string) {
  return moduleLabels[module] ?? titleizeSlug(module);
}

function resourceLabel(resource: string) {
  return titleizeSlug(resource);
}

export function actionLabel(action: string) {
  return actionLabels[action] ?? titleizeSlug(action);
}

export function buildPermissionSections(
  groupedPermissions: GroupedPermissions | undefined
): PermissionSection[] {
  if (!groupedPermissions) {
    return [];
  }

  return Object.entries(groupedPermissions).map(([module, permissions]) => {
    const resourceOrder: string[] = [];
    const permissionsByResource = new Map<string, PermissionListItem[]>();

    for (const permission of permissions) {
      if (!permissionsByResource.has(permission.resource)) {
        permissionsByResource.set(permission.resource, []);
        resourceOrder.push(permission.resource);
      }

      permissionsByResource.get(permission.resource)?.push(permission);
    }

    return {
      id: module,
      label: moduleLabel(module),
      resources: resourceOrder.map((resource) => ({
        id: resource,
        label: resourceLabel(resource),
        permissions: permissionsByResource.get(resource) ?? [],
      })),
    };
  });
}

export function countSectionPermissions(section: PermissionSection) {
  return section.resources.reduce((total, resource) => total + resource.permissions.length, 0);
}

export function countGrantedInSection(
  section: PermissionSection,
  grantedPermissionIds: Set<number>
) {
  return section.resources.reduce(
    (sectionTotal, resource) =>
      sectionTotal +
      resource.permissions.filter((permission) => grantedPermissionIds.has(permission.id)).length,
    0
  );
}
