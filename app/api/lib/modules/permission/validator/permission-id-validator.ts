import type { ValidationResult } from '@/app/api/lib/utils/types';
import { permissionIdSchema, type PermissionIdInput } from '../schemas/permission-schema';

export function validatePermissionId(payload: unknown): ValidationResult<PermissionIdInput> {
  const result = permissionIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`Permission ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
