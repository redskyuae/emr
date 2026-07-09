import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { visitStatusRepository } from '../repository/visit-status-repository';
import type { VisitStatus } from '../schemas/visit-status-schema';
import { validateGetVisitStatuses } from '../validator/get-visit-statuses-validator';

export type GetVisitStatusesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getVisitStatusesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetVisitStatusesParams): Promise<ListQueryResult<VisitStatus>> {
  const tenantIdValidationResult = validateGetVisitStatuses(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await visitStatusRepository.getVisitStatuses({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
