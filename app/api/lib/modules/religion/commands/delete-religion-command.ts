import type { CommandResult } from '@/app/api/lib/utils/types';
import { religionRepository } from '../repository/religion-repository';
import type { Religion } from '../schemas/religion-schema';
import { validateReligionId } from '../validator/religion-id-validator';

const NOT_FOUND_STATUS = 404;

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
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedReligion };
}
