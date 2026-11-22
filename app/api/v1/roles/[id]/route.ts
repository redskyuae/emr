import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetRoleResponse, UpdateRoleResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { deleteRoleCommand } from '@/app/api/lib/modules/role/commands/delete-role-command';
import { updateRoleCommand } from '@/app/api/lib/modules/role/commands/update-role-command';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { diffAuditFields, type AuditField } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';

const ROLE_AUDIT_FIELDS = [
  { path: 'name', label: 'Name' },
  { path: 'code', label: 'Code' },
  { path: 'description', label: 'Description' },
] as const satisfies readonly AuditField[];

type RoleRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Role not found';
  }

  if (
    (status === StatusCodes.CONFLICT || status === StatusCodes.UNPROCESSABLE_ENTITY) &&
    errors.length === 1
  ) {
    return errors[0];
  }

  if (status === StatusCodes.CONFLICT) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getRoleByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetRoleResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Read before writing so the Audit Event can carry the before/after.
    const before = await getRoleByIdQuery(id, tenantSession.tenantId);
    const result = await updateRoleCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'role_changed', {
      action: 'updated',
      is_system_role: result.data.isSystem,
    });

    await recordAuditEvent(tenantSession, request, 'role.update', {
      entityId: result.data.id,
      entityLabel: result.data.name,
      changes: before.success ? diffAuditFields(before.data, result.data, ROLE_AUDIT_FIELDS) : null,
    });

    return NextResponse.json<UpdateRoleResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deleteRoleCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      if (status === StatusCodes.UNPROCESSABLE_ENTITY) {
        return NextResponse.json({ message: errorMessage(status, result.errors) }, { status });
      }

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'role_changed', {
      action: 'deleted',
      is_system_role: result.data.isSystem,
    });

    await recordAuditEvent(tenantSession, request, 'role.delete', {
      entityId: result.data.id,
      entityLabel: result.data.name,
      metadata: { code: result.data.code },
    });

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
