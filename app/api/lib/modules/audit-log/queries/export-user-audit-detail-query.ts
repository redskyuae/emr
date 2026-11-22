import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import type { AuditExportFormat } from '../schemas/audit-log-schema';
import type { UserAuditDetail } from '../schemas/user-audit-schema';
import { validateExportUserAuditDetail } from '../validator/get-user-audit-validator';
import { getUserAuditDetailQuery } from './get-user-audit-detail-query';

type UserAuditDetailExport = {
  format: AuditExportFormat;
  tenantName: string;
  filters: { fromDate?: string; toDate?: string };
  detail: UserAuditDetail;
};

/** One member's User Audit, exactly as their page shows it, for the CSV or PDF export. */
export async function exportUserAuditDetailQuery(
  userId: unknown,
  filters: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<UserAuditDetailExport>> {
  const validationResult = validateExportUserAuditDetail(userId, filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { userId: validUserId, tenantId: validTenantId, format, ...range } = validationResult.data;
  const [detailResult, tenant] = await Promise.all([
    getUserAuditDetailQuery(validUserId, range, validTenantId),
    tenantRepository.getTenantById(validTenantId),
  ]);

  if (!detailResult.success) {
    return detailResult;
  }

  return {
    success: true,
    data: { detail: detailResult.data, format, tenantName: tenant?.name ?? '', filters: range },
  };
}
