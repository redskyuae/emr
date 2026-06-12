import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { permissionRepository } from '../repository/permission-repository';
import type {
  GroupedPermissions,
  Permission,
  PermissionListItem,
  PermissionListParams,
} from '../schemas/permission-schema';

function toPermissionListItem(permission: Permission): PermissionListItem {
  return {
    id: permission.id,
    name: permission.name,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  };
}

function groupPermissionsByModule(permissions: Permission[]) {
  return permissions.reduce<GroupedPermissions>((groupedPermissions, permission) => {
    groupedPermissions[permission.module] ??= [];
    groupedPermissions[permission.module].push(toPermissionListItem(permission));
    return groupedPermissions;
  }, {});
}

export async function getPermissionsQuery({ module }: PermissionListParams = {}): Promise<
  SingleQueryResult<GroupedPermissions>
> {
  try {
    const permissions = await permissionRepository.getPermissions({ module });

    return { success: true, data: groupPermissionsByModule(permissions) };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);

    return { success: false, errors: [errMessage], status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
}
