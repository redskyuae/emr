import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';

/**
 * Guards every amendment of a closed encounter. Shared by the Visit, Clinical
 * Note and Vital Sign amend paths so all three enforce the same rule: only a
 * Completed Visit of this Tenant may be amended. Active Visits keep using the
 * ordinary edit endpoints, and a Cancelled Visit never took place.
 */
export async function validateVisitForAmendment(
  visitId: number,
  tenantId: string
): Promise<ValidationResult<Visit>> {
  const visit = await visitRepository.getVisitById(visitId, tenantId);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  if (visit.status !== 'COMPLETED') {
    return {
      success: false,
      errors: [`Visit ${visit.visitNumber} is not completed and cannot be amended.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: visit };
}
