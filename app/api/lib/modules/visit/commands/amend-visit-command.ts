import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateAmendVisit } from '../validator/amend-visit-validator';

export async function amendVisitCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Visit>> {
  const validationResult = await validateAmendVisit(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const amendedVisit = await visitRepository.amendVisit(
    validationResult.data.id,
    tenantId,
    validationResult.data.payload
  );

  if (!amendedVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: amendedVisit };
}
