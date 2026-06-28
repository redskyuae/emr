import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateNationalityId } from '../validator/nationality-id-validator';

export async function deleteNationalityCommand(id: unknown): Promise<CommandResult<Nationality>> {
  const validationResult = validateNationalityId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedNationality = await nationalityRepository.deleteNationality(
    validationResult.data
  );

  if (!deletedNationality) {
    return {
      success: false,
      errors: ['Nationality not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedNationality };
}
