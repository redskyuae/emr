import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../repository/visit-status-repository';
import type { VisitStatus } from '../schemas/visit-status-schema';
import { validateGetVisitStatusById } from '../validator/get-visit-status-by-id-validator';

export async function getVisitStatusByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<VisitStatus>> {
  const validationResult = validateGetVisitStatusById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const visitStatus = await visitStatusRepository.getVisitStatusById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!visitStatus) {
    return {
      success: false,
      errors: ['Visit status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: visitStatus };
}
