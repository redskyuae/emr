import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { religionRepository } from '../repository/religion-repository';
import type { Religion, ReligionListParams } from '../schemas/religion-schema';

export async function getReligionsQuery({
  page = 1,
  limit = 10,
  query,
}: ReligionListParams = {}): Promise<ListQueryResult<Religion>> {
  const { data, total } = await religionRepository.getReligions({ page, limit, query });

  return { success: true, data, total };
}
