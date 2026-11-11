import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { admitSourceRepository } from '../repository/admit-source-repository';
import type { AdmitSource } from '../schemas/admit-source-schema';
import { validateGetAdmitSources } from '../validator/get-admit-sources-validator';

type GetAdmitSourcesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getAdmitSourcesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAdmitSourcesParams): Promise<ListQueryResult<AdmitSource>> {
  const tenantIdValidationResult = validateGetAdmitSources(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await admitSourceRepository.getAdmitSources({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
