import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roomTypeIdSchema, roomTypeTenantIdSchema } from '../schemas/room-type-schema';

export type GetRoomTypeByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetRoomTypeById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetRoomTypeByIdInput> {
  const idResult = roomTypeIdSchema.safeParse(id);
  const tenantIdResult = roomTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Room type ${String(id)} is Invalid.`);
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
