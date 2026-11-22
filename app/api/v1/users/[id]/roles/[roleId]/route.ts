import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { recordStaffRoleRemoved } from '@/app/api/lib/analytics/access-assignment-event';
import { removeRoleCommand } from '@/app/api/lib/modules/user-role/commands/remove-role-command';
import { USER_MUST_HAVE_ROLE_MESSAGE } from '@/app/api/lib/modules/user-role/validator/remove-role-validator';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';

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

export async function DELETE(request: NextRequest, context: UserRoleRouteContext) {
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

    recordStaffRoleRemoved(tenantSession, request, result.data.userId);

    const [staff, role] = await Promise.all([
      getStaffByIdQuery(result.data.userId, tenantSession.tenantId),
      getRoleByIdQuery(result.data.roleId, tenantSession.tenantId),
    ]);

    await recordAuditEvent(tenantSession, request, 'user.role-remove', {
      entityId: result.data.userId,
      entityLabel: staff.success ? staff.data.email : null,
      metadata: { roleId: result.data.roleId, roleName: role.success ? role.data.name : null },
    });

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
