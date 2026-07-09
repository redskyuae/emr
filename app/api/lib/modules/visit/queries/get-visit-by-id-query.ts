import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';

export async function getVisitByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Visit>> {
  const validationResult = validateGetVisitById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const visit = await visitRepository.getVisitById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: visit };
}
