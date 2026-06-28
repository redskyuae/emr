import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { StaffStatusFilter, StaffWithRoles } from '../schemas/staff-schema';

export type GetStaffParams = {
  tenantId: string;
  page?: number;
  limit?: number;
  query?: string;
  roleId?: number;
  status?: StaffStatusFilter;
};

export async function getStaffQuery({
  tenantId,
  page,
  limit,
  query,
  roleId,
  status,
}: GetStaffParams): Promise<ListQueryResult<StaffWithRoles>> {
  const { data, total } = await staffRepository.getStaff({
    tenantId,
    page,
    limit,
    query,
    roleId,
    status,
  });

  return { success: true, data, total };
}
