import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { religionRepository } from '../repository/religion-repository';
import type { Religion } from '../schemas/religion-schema';
import { validateReligionId } from '../validator/religion-id-validator';

export async function deleteReligionCommand(id: unknown): Promise<CommandResult<Religion>> {
  const validationResult = validateReligionId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedReligion = await religionRepository.softDeleteReligion(validationResult.data);

  if (!deletedReligion) {
    return {
      success: false,
      errors: ['Religion not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedReligion };
}
