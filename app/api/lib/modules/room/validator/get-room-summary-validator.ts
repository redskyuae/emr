import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomTenantIdSchema } from '../schemas/room-schema';

export function validateGetRoomSummary(tenantId: unknown): ValidationResult<string> {
  const result = roomTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
