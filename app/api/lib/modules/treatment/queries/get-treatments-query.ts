import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { treatmentRepository } from '../repository/treatment-repository';
import type { Treatment } from '../schemas/treatment-schema';
import { validateGetTreatments } from '../validator/get-treatments-validator';

export type GetTreatmentsParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getTreatmentsQuery({
  tenantId,
  page,
  limit,
  query,
}: GetTreatmentsParams): Promise<ListQueryResult<Treatment>> {
  const tenantIdValidationResult = validateGetTreatments(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await treatmentRepository.getTreatments({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
