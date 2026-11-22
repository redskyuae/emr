import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { auditFileDate } from '@/app/api/lib/audit/audit-export-format';
import { auditFileResponse, auditReportContext } from '@/app/api/lib/audit/audit-export-response';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { toUserAuditListCsv, toUserAuditListPdf } from '@/app/api/lib/audit/user-audit-export';
import { exportUserAuditListQuery } from '@/app/api/lib/modules/audit-log/queries/export-user-audit-list-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export const runtime = 'nodejs';

const PARAM_NAMES = ['fromDate', 'toDate', 'query', 'format'] as const;

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'audit-log:read',
      'audit-log:export',
    ]);

    if (permissionResponse) {
      return permissionResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(
      PARAM_NAMES.flatMap((name) => {
        const value = searchParams.get(name)?.trim();
        return value ? [[name, value]] : [];
      })
    );

    const result = await exportUserAuditListQuery(filters, tenantSession.tenantId);

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

    const { users, format, timeZone, tenantName, filters: appliedFilters } = result.data;
    const context = await auditReportContext(tenantSession, { tenantName, timeZone });
    const body =
      format === 'pdf'
        ? await toUserAuditListPdf(users, appliedFilters, context)
        : toUserAuditListCsv(users, appliedFilters, timeZone);

    await recordAuditEvent(tenantSession, request, 'user-audit.list-export', {
      metadata: { filters: appliedFilters, rowCount: users.length, format },
    });

    return auditFileResponse(body, {
      format,
      rowCount: users.length,
      basename: `user-audit-events-${auditFileDate(context.exportedAt, timeZone)}`,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
