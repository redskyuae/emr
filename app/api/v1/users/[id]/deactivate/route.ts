import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateStaffResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { deactivateStaffCommand } from '@/app/api/lib/modules/staff/commands/deactivate-staff-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';

type StaffRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Staff not found';
  }

  return 'Validation failed';
}

export async function PATCH(request: NextRequest, context: StaffRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deactivateStaffCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'staff_changed', {
      profile_kind: 'staff',
      action: 'deactivated',
    });

    await recordAuditEvent(tenantSession, request, 'user.deactivate', {
      entityId: result.data.id,
      entityLabel: result.data.email,
    });

    return NextResponse.json<DeactivateStaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
