import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { StaffStatusFilter, StaffWithRoles } from '../schemas/staff-schema';

export type GetStaffParams = {
  page?: number;
  limit?: number;
  query?: string;
  roleId?: number;
  tenantId: string;
  status?: StaffStatusFilter;
};

export async function getStaffQuery({
  page,
  limit,
  query,
  roleId,
  tenantId,
  status,
}: GetStaffParams): Promise<ListQueryResult<StaffWithRoles>> {
  const { data, total } = await staffRepository.getStaff({
    page,
    limit,
    query,
    roleId,
    status,
    tenantId,
  });

  return { success: true, data, total };
}
