import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { AssignUserRolesResponse, GetUserRolesResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { assignRolesCommand } from '@/app/api/lib/modules/user-role/commands/assign-roles-command';
import { getUserRolesQuery } from '@/app/api/lib/modules/user-role/queries/get-user-roles-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';

type UserRolesRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND && errors.includes('Staff not found')) {
    return 'Staff not found';
  }

  if (
    status === StatusCodes.NOT_FOUND &&
    errors.some((error) => error.startsWith('Role not found'))
  ) {
    return 'Role not found';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: UserRolesRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId } = await context.params;
    const result = await getUserRolesQuery(userId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetUserRolesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest, context: UserRolesRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const before = await getUserRolesQuery(userId, tenantSession.tenantId);
    const result = await assignRolesCommand(
      userId,
      tenantSession.tenantId,
      tenantSession.session.user.id,
      payload
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'staff_roles_changed', {
      role_count: result.data.length,
    });

    await recordAuditEvent(tenantSession, request, 'user.role-assign', async () => {
      const staff = await getStaffByIdQuery(userId, tenantSession.tenantId);
      const beforeIds = new Set(before.success ? before.data.map(({ id }) => id) : []);

      return {
        entityId: userId,
        entityLabel: staff.success ? staff.data.email : null,
        metadata: {
          assigned: result.data
            .filter(({ id }) => !beforeIds.has(id))
            .map(({ id, name }) => ({ roleId: id, roleName: name })),
          roleCount: result.data.length,
        },
      };
    });

    return NextResponse.json<AssignUserRolesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
