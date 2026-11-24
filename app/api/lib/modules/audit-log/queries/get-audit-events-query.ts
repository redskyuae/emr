import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { auditLogRepository } from '../repository/audit-log-repository';
import type { AuditEventListItem } from '../schemas/audit-log-schema';
import { validateGetAuditEvents } from '../validator/get-audit-events-validator';

// Matches the Tenant time zone fallback in the tenant repository.
const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export async function getAuditEventsQuery(
  filters: unknown,
  tenantId: unknown
): Promise<ListQueryResult<AuditEventListItem>> {
  const validationResult = validateGetAuditEvents(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const tenant = await tenantRepository.getTenantById(validationResult.data.tenantId);
  const { data, total } = await auditLogRepository.getAuditEvents({
    ...validationResult.data,
    timeZone: tenant?.timeZone ?? DEFAULT_TIME_ZONE,
  });

  return { success: true, data, total };
}
