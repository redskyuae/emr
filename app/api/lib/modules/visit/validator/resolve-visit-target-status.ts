import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../../visit-status/repository/visit-status-repository';
import type { VisitStatusCategory } from '../../visit-status/schemas/visit-status-schema';

export async function resolveVisitTargetStatus(
  tenantId: string,
  category: VisitStatusCategory,
  statusId?: number
): Promise<ValidationResult<number>> {
  if (statusId === undefined) {
    const systemStatus = await visitStatusRepository.getSystemVisitStatusByCategory(
      tenantId,
      category
    );

    if (!systemStatus) {
      return {
        success: false,
        errors: [`No ${category} Visit status is configured for this Tenant.`],
        status: StatusCodes.CONFLICT,
      };
    }

    return { success: true, data: systemStatus.id };
  }

  const requestedStatus = await visitStatusRepository.getVisitStatusById(statusId, tenantId);

  if (!requestedStatus) {
    return { success: false, errors: [`Visit status ${statusId} is Invalid.`] };
  }

  if (requestedStatus.category !== category) {
    return {
      success: false,
      errors: [`Visit status ${statusId} does not belong to the ${category} category.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: requestedStatus.id };
}
