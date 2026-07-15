import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { roomRepository } from '../repository/room-repository';

const ROOM_NUMBER_EXISTS = "Room number '{value}' already exists.";

type RoomNumberUniquenessInput = {
  tenantId: string;
  roomNumber: string;
  excludeId?: number;
};

function duplicateError(value: string) {
  return ROOM_NUMBER_EXISTS.replace('{value}', value);
}

export async function validateRoomNumberUniqueness({
  tenantId,
  roomNumber,
  excludeId,
}: RoomNumberUniquenessInput): Promise<ValidationResult<void>> {
  const existing = await roomRepository.findActiveByRoomNumber(tenantId, roomNumber, { excludeId });

  if (existing) {
    return {
      success: false,
      errors: [duplicateError(roomNumber)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getRoomNumberUniqueConstraintErrors(
  error: unknown,
  input: Pick<RoomNumberUniquenessInput, 'roomNumber'>
): string[] {
  const databaseError = getDatabaseError(error);

  if (databaseError?.code !== '23505') {
    return [];
  }

  if (databaseError.constraint === 'room_tenant_room_number_idx') {
    return [duplicateError(input.roomNumber)];
  }

  return [];
}
