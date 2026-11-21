import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { VisitStatusCounts } from '../schemas/visit-schema';
import { validateGetVisitStatusCounts } from '../validator/get-visit-status-counts-validator';

type GetVisitStatusCountsParams = {
  filters?: unknown;
  tenantId: unknown;
};

export async function getVisitStatusCountsQuery({
  filters,
  tenantId,
}: GetVisitStatusCountsParams): Promise<SingleQueryResult<VisitStatusCounts>> {
  const validationResult = validateGetVisitStatusCounts(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const data = await visitRepository.countVisitsByStatus(validationResult.data);

  return { success: true, data };
}
