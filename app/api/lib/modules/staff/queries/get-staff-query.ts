import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';

export type GetStaffParams = {
  tenantId: string;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getStaffQuery({
  tenantId,
  page,
  limit,
  query,
}: GetStaffParams): Promise<ListQueryResult<Staff>> {
  const { data, total } = await staffRepository.getStaff({ tenantId, page, limit, query });

  return { success: true, data, total };
}
