import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { removePermissionCommand } from '@/app/api/lib/modules/role-permission/commands/remove-permission-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type RolePermissionRouteContext = {
  params: Promise<{ id: string; permissionId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND && errors.includes('Role not found')) {
    return 'Role not found';
  }

  if (status === StatusCodes.NOT_FOUND && errors.includes('Permission Assignment not found')) {
    return 'Permission Assignment not found';
  }

  return 'Validation failed';
}

export async function DELETE(_request: NextRequest, context: RolePermissionRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, permissionId } = await context.params;
    const result = await removePermissionCommand(id, permissionId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
