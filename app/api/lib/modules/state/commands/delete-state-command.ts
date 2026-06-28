import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { stateRepository } from '../repository/state-repository';
import type { State } from '../schemas/state-schema';
import { validateStateId } from '../validator/state-id-validator';

export async function deleteStateCommand(id: unknown): Promise<CommandResult<State>> {
  const validationResult = validateStateId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedState = await stateRepository.deleteState(validationResult.data);

  if (!deletedState) {
    return {
      success: false,
      errors: ['State not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedState };
}
