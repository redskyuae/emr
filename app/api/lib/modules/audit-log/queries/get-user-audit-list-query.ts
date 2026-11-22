import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userAuditRepository } from '../repository/user-audit-repository';
import type { UserAuditListItem } from '../schemas/user-audit-schema';
import { validateGetUserAuditList } from '../validator/get-user-audit-validator';

// Matches the Tenant time zone fallback in the tenant repository.
const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export async function getUserAuditListQuery(
  filters: unknown,
  tenantId: unknown
): Promise<ListQueryResult<UserAuditListItem>> {
  const validationResult = validateGetUserAuditList(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const tenant = await tenantRepository.getTenantById(validationResult.data.tenantId);
  const { data, total } = await userAuditRepository.getUserAuditList({
    ...validationResult.data,
    timeZone: tenant?.timeZone ?? DEFAULT_TIME_ZONE,
  });

  return { success: true, data, total };
}
