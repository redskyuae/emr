import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCreateVisit } from '../validator/create-visit-validator';

export async function createVisitCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Visit>> {
  const validationResult = await validateCreateVisit(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const createdVisit = await visitRepository.createVisit({ ...validationResult.data, tenantId });

  return { success: true, data: createdVisit };
}
