import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomIdSchema, roomTenantIdSchema } from '../schemas/room-schema';

export type DeleteRoomInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteRoom(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteRoomInput> {
  const idResult = roomIdSchema.safeParse(id);
  const tenantIdResult = roomTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Room ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
