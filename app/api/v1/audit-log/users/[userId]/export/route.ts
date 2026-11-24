import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { auditFileDate } from '@/app/api/lib/audit/audit-export-format';
import {
  auditFileResponse,
  auditFileSlug,
  auditReportContext,
} from '@/app/api/lib/audit/audit-export-response';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { toUserAuditDetailCsv, toUserAuditDetailPdf } from '@/app/api/lib/audit/user-audit-export';
import { exportUserAuditDetailQuery } from '@/app/api/lib/modules/audit-log/queries/export-user-audit-detail-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export const runtime = 'nodejs';

const PARAM_NAMES = ['fromDate', 'toDate', 'format'] as const;

type UserAuditExportRouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: NextRequest, routeContext: UserAuditExportRouteContext) {
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

    const { userId } = await routeContext.params;
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(
      PARAM_NAMES.flatMap((name) => {
        const value = searchParams.get(name)?.trim();
        return value ? [[name, value]] : [];
      })
    );

    const result = await exportUserAuditDetailQuery(userId, filters, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'User not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    const { detail, format, tenantName, filters: range } = result.data;
    const context = await auditReportContext(tenantSession, {
      tenantName,
      timeZone: detail.timeZone,
    });
    const body =
      format === 'pdf'
        ? await toUserAuditDetailPdf(detail, range, context, context.exportedAt)
        : toUserAuditDetailCsv(detail, range, context.exportedAt);

    await recordAuditEvent(tenantSession, request, 'user-audit.export', {
      entityId: detail.user.userId,
      entityLabel: detail.user.name,
      metadata: { filters: range, rowCount: detail.sessions.length, format },
    });

    return auditFileResponse(body, {
      format,
      rowCount: detail.sessions.length,
      basename: `user-audit-${auditFileSlug(detail.user.name)}-${auditFileDate(context.exportedAt, detail.timeZone)}`,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
