import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateStateId } from '../validator/state-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getStateByIdQuery(id: unknown): Promise<SingleQueryResult<State>> {
  const validationResult = validateStateId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const state = await stateRepository.getStateById(validationResult.data);

  if (!state) {
    return {
      success: false,
      errors: ['State not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: state };
}
