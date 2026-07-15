import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomTypeTenantIdSchema } from '../schemas/room-type-schema';

export function validateGetRoomTypes(tenantId: unknown): ValidationResult<string> {
  const result = roomTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
