import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { toAuditCsv } from '@/app/api/lib/audit/audit-csv';
import { auditFileDate } from '@/app/api/lib/audit/audit-export-format';
import { auditFileResponse, auditReportContext } from '@/app/api/lib/audit/audit-export-response';
import { toAuditPdf } from '@/app/api/lib/audit/audit-pdf';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { exportAuditEventsQuery } from '@/app/api/lib/modules/audit-log/queries/export-audit-events-query';
import { AUDIT_FILTER_NAMES } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    // Exporting is a separate grant from reading: data leaving the system is the
    // riskier act, so a Role may view the Audit Log without being able to export it.
    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'audit-log:read',
      'audit-log:export',
    ]);

    if (permissionResponse) {
      return permissionResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(
      [...AUDIT_FILTER_NAMES, 'format'].flatMap((name) => {
        const value = searchParams.get(name)?.trim();
        return value ? [[name, value]] : [];
      })
    );

    const result = await exportAuditEventsQuery(filters, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message:
            status === StatusCodes.UNPROCESSABLE_ENTITY ? result.errors[0] : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    const { events, format, timeZone, tenantName, filters: appliedFilters } = result.data;
    const context = await auditReportContext(tenantSession, { tenantName, timeZone });
    const body =
      format === 'pdf'
        ? await toAuditPdf(events, appliedFilters, context)
        : toAuditCsv(events, timeZone);

    // The export is itself an Audit Event, carrying exactly what was exported.
    await recordAuditEvent(tenantSession, request, 'audit-log.export', {
      metadata: { filters: appliedFilters, rowCount: events.length, format },
    });

    return auditFileResponse(body, {
      format,
      rowCount: events.length,
      basename: `audit-events-${auditFileDate(context.exportedAt, timeZone)}`,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
