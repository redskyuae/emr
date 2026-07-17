import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { roomRepository } from '../../room/repository/room-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import type { Ward } from '../../ward/schemas/ward-schema';
import type { CreateBedInput, UpdateBedInput } from '../schemas/bed-schema';

type BedReferenceInput = Pick<CreateBedInput | UpdateBedInput, 'wardId' | 'roomId'>;

export async function validateBedReferences(
  input: BedReferenceInput,
  tenantId: string
): Promise<ValidationResult<{ ward: Ward }>> {
  const [ward, room] = await Promise.all([
    wardRepository.getWardById(input.wardId, tenantId),
    input.roomId !== undefined
      ? roomRepository.getRoomById(input.roomId, tenantId)
      : Promise.resolve(undefined),
  ]);

  const errors: string[] = [];

  if (!ward) {
    errors.push(`Ward ${input.wardId} is Invalid.`);
  }

  if (input.roomId !== undefined && !room) {
    errors.push(`Room ${input.roomId} is Invalid.`);
  }

  if (errors.length > 0 || !ward) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: { ward } };
}
