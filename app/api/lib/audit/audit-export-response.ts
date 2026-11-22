// The HTTP side of the Audit Log and User Audit exports: who is exporting, for
// the report's header, and the downloadable file response.

import { StatusCodes } from 'http-status-codes';

import { getExportBrand } from '@/app/api/lib/export/export-brand';
import type { AuditExportFormat } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AuditReportContext } from './audit-export-format';

export async function auditReportContext(
  tenantSession: TenantSession,
  report: { tenantName: string; timeZone: string }
): Promise<AuditReportContext> {
  const { user } = tenantSession.session;

  return {
    brand: await getExportBrand(),
    timeZone: report.timeZone,
    tenantName: report.tenantName,
    exportedAt: new Date(),
    exportedBy: { name: user.name, email: user.email },
  };
}

/** A name as a safe, lower-case file name part: "Dr. Sara Ali" becomes "dr-sara-ali". */
export function auditFileSlug(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '-')
      .slice(0, 60) || 'user'
  );
}

export function auditFileResponse(
  body: string | Uint8Array,
  file: { format: AuditExportFormat; basename: string; rowCount: number }
) {
  const contentType = file.format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8';
  // Copy into a fresh ArrayBuffer, which a Response accepts on every runtime.
  const payload = typeof body === 'string' ? body : new Uint8Array(body).buffer;

  return new Response(payload, {
    status: StatusCodes.OK,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-Audit-Row-Count': String(file.rowCount),
      'Content-Disposition': `attachment; filename="${file.basename}.${file.format}"`,
    },
  });
}
