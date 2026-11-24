import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userAuditRepository } from '../repository/user-audit-repository';
import type { AuditExportFormat } from '../schemas/audit-log-schema';
import { USER_AUDIT_EXPORT_MAX_USERS, type UserAuditListItem } from '../schemas/user-audit-schema';
import { validateExportUserAuditList } from '../validator/get-user-audit-validator';

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

type UserAuditListExport = {
  format: AuditExportFormat;
  timeZone: string;
  tenantName: string;
  filters: { fromDate?: string; toDate?: string; query?: string };
  users: UserAuditListItem[];
};

/**
 * Every Tenant member the User Audit list would show for these filters, for the
 * CSV or PDF export. Refuses a Tenant over the cap rather than cutting the list.
 */
export async function exportUserAuditListQuery(
  filters: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<UserAuditListExport>> {
  const validationResult = validateExportUserAuditList(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { tenantId: validTenantId, format, ...validFilters } = validationResult.data;
  const tenant = await tenantRepository.getTenantById(validTenantId);
  const timeZone = tenant?.timeZone ?? DEFAULT_TIME_ZONE;
  const { data, total } = await userAuditRepository.getUserAuditList({
    ...validFilters,
    tenantId: validTenantId,
    timeZone,
    page: 1,
    // One past the cap, so a member added after the count still refuses the export.
    limit: USER_AUDIT_EXPORT_MAX_USERS + 1,
  });

  if (data.length > USER_AUDIT_EXPORT_MAX_USERS || total > USER_AUDIT_EXPORT_MAX_USERS) {
    const found = Math.max(total, data.length);

    return {
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [
        `Export is limited to ${USER_AUDIT_EXPORT_MAX_USERS.toLocaleString('en-US')} users; this search has ${found.toLocaleString('en-US')}. Narrow the search and try again.`,
      ],
    };
  }

  return {
    success: true,
    data: { users: data, format, timeZone, tenantName: tenant?.name ?? '', filters: validFilters },
  };
}
