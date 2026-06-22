import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
import type { RoleWithStats } from '../schemas/role-schema';

export type GetRolesParams = {
  tenantId: string;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getRolesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetRolesParams): Promise<ListQueryResult<RoleWithStats>> {
  const { data, total } = await roleRepository.getRoles({ tenantId, page, limit, query });

  return { success: true, data, total };
}
