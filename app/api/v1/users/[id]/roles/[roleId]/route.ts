import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { removeRoleCommand } from '@/app/api/lib/modules/user-role/commands/remove-role-command';
import { USER_MUST_HAVE_ROLE_MESSAGE } from '@/app/api/lib/modules/user-role/validator/remove-role-validator';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type UserRoleRouteContext = {
  params: Promise<{ id: string; roleId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND && errors.includes('Staff not found')) {
    return 'Staff not found';
  }

  if (status === StatusCodes.NOT_FOUND && errors.includes('Role not found')) {
    return 'Role not found';
  }

  if (status === StatusCodes.NOT_FOUND && errors.includes('Role Assignment not found')) {
    return 'Role Assignment not found';
  }

  if (status === StatusCodes.UNPROCESSABLE_ENTITY) {
    return USER_MUST_HAVE_ROLE_MESSAGE;
  }

  return 'Validation failed';
}

export async function DELETE(_request: NextRequest, context: UserRoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId, roleId } = await context.params;
    const result = await removeRoleCommand(userId, roleId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = errorMessage(status, result.errors);

      if (status === StatusCodes.UNPROCESSABLE_ENTITY) {
        return NextResponse.json({ message }, { status });
      }

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
