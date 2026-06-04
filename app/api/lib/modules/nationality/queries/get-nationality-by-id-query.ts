import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateNationalityId } from '../validator/nationality-id-validator';

const NOT_FOUND_STATUS = 404;

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
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: nationality };
}
