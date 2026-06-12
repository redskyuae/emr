import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateNationalityId } from '../validator/nationality-id-validator';

export async function getNationalityByIdQuery(
  id: unknown
): Promise<SingleQueryResult<Nationality>> {
  const validationResult = validateNationalityId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const nationality = await nationalityRepository.getNationalityById(validationResult.data);

  if (!nationality) {
    return {
      success: false,
      errors: ['Nationality not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: nationality };
}
