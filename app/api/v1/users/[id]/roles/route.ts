import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { assignRolesCommand } from '@/app/api/lib/modules/user-role/commands/assign-roles-command';
import { getUserRolesQuery } from '@/app/api/lib/modules/user-role/queries/get-user-roles-query';
import type { AssignedRole } from '@/app/api/lib/modules/user-role/schemas/user-role-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type UserRolesRouteContext = {
  params: Promise<{ id: string }>;
};

export type AssignUserRolesRequest = {
  roleIds: number[];
};

export type UserRolesResponse = {
  data: AssignedRole[];
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

    return NextResponse.json<UserRolesResponse>({ data: result.data });
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

    return NextResponse.json<UserRolesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
