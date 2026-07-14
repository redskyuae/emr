import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../repository/room-repository';
import type { RoomSummary } from '../schemas/room-schema';
import { validateGetRoomSummary } from '../validator/get-room-summary-validator';

export async function getRoomSummaryQuery(
  tenantId: unknown
): Promise<SingleQueryResult<RoomSummary>> {
  const tenantResult = validateGetRoomSummary(tenantId);

  if (!tenantResult.success) {
    return tenantResult;
  }

  const summary = await roomRepository.getRoomSummary(tenantResult.data);

  return { success: true, data: summary };
}
