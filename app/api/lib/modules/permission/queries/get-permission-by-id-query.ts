import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { permissionRepository } from '../repository/permission-repository';
import type { Permission } from '../schemas/permission-schema';
import { validatePermissionId } from '../validator/permission-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getPermissionByIdQuery(id: unknown): Promise<SingleQueryResult<Permission>> {
  const validationResult = validatePermissionId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const permission = await permissionRepository.getPermissionById(validationResult.data);

  if (!permission) {
    return {
      success: false,
      errors: ['Permission not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: permission };
}
