import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { auditLogRepository } from '../repository/audit-log-repository';
import {
  AUDIT_EXPORT_MAX_ROWS,
  AUDIT_PDF_EXPORT_MAX_ROWS,
  type AuditEventFilters,
  type AuditEventListItem,
  type AuditExportFormat,
} from '../schemas/audit-log-schema';
import { validateExportAuditEvents } from '../validator/get-audit-events-validator';

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

type AuditExport = {
  format: AuditExportFormat;
  timeZone: string;
  tenantName: string;
  filters: AuditEventFilters;
  events: AuditEventListItem[];
};

function tooManyEvents(format: AuditExportFormat, total: number) {
  const limit = format === 'pdf' ? AUDIT_PDF_EXPORT_MAX_ROWS : AUDIT_EXPORT_MAX_ROWS;
  const found = `this selection has ${total.toLocaleString('en-US')}`;

  return format === 'pdf'
    ? `PDF export is limited to ${limit.toLocaleString('en-US')} Audit Events; ${found}. Narrow the filters or export CSV.`
    : `Export is limited to ${limit.toLocaleString('en-US')} Audit Events; ${found}. Narrow the filters and try again.`;
}

// Reads one row past the cap for its format and refuses the export when that row
// comes back, rather than silently truncating it: a partial audit export reads as
// a complete one. Reading the rows in one query (not count-then-fetch) means
// events recorded in between cannot push the oldest rows out unnoticed. Only a
// refused export is counted, for the figure in the message.
export async function exportAuditEventsQuery(
  filters: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AuditExport>> {
  const validationResult = validateExportAuditEvents(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { tenantId: validTenantId, format, ...validFilters } = validationResult.data;
  const tenant = await tenantRepository.getTenantById(validTenantId);
  const timeZone = tenant?.timeZone ?? DEFAULT_TIME_ZONE;
  const params = { ...validFilters, tenantId: validTenantId, timeZone };
  const limit = format === 'pdf' ? AUDIT_PDF_EXPORT_MAX_ROWS : AUDIT_EXPORT_MAX_ROWS;
  const events = await auditLogRepository.getAuditEventsForExport(params, limit + 1);

  if (events.length > limit) {
    const total = await auditLogRepository.countAuditEvents(params);

    return {
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: [tooManyEvents(format, Math.max(total, events.length))],
    };
  }

  return {
    success: true,
    data: { events, format, timeZone, tenantName: tenant?.name ?? '', filters: validFilters },
  };
}
