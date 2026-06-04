import type { ListQueryResult } from '@/app/api/lib/utils/types';
import type { Nationality, NationalityListParams } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';

export async function getNationalitiesQuery({
  page = 1,
  limit = 10,
  query,
}: NationalityListParams = {}): Promise<ListQueryResult<Nationality>> {
  const { data, total } = await nationalityRepository.getNationalities({ page, limit, query });

  return { success: true, data, total };
}
