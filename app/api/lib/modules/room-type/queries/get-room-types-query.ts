import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { roomTypeRepository } from '../repository/room-type-repository';
import type { RoomType } from '../schemas/room-type-schema';
import { validateGetRoomTypes } from '../validator/get-room-types-validator';

export type GetRoomTypesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getRoomTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetRoomTypesParams): Promise<ListQueryResult<RoomType>> {
  const tenantIdValidationResult = validateGetRoomTypes(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await roomTypeRepository.getRoomTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
