import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { roomTypeRepository } from '../repository/room-type-repository';

const ROOM_TYPE_NAME_EXISTS = "Room type name '{value}' already exists.";
const ROOM_TYPE_CODE_EXISTS = "Room type code '{value}' already exists.";

type RoomTypeUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateRoomTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: RoomTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    roomTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    roomTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ROOM_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ROOM_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getRoomTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<RoomTypeUniquenessInput, 'name' | 'code'>
): string[] {
  const databaseError = getDatabaseError(error);

  if (databaseError?.code !== '23505') {
    return [];
  }

  if (databaseError.constraint === 'room_type_tenant_name_idx') {
    return [duplicateError(ROOM_TYPE_NAME_EXISTS, input.name)];
  }

  if (databaseError.constraint === 'room_type_tenant_code_idx') {
    return [duplicateError(ROOM_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
