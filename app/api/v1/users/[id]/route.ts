import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetStaffResponse, UpdateStaffResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { updateStaffCommand } from '@/app/api/lib/modules/staff/commands/update-staff-command';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { diffAuditFields, type AuditField } from '@/app/api/lib/audit/audit-changes';

const STAFF_AUDIT_FIELDS = [
  { path: 'name', label: 'Name' },
  { path: 'email', label: 'Email' },
  { path: 'phone', label: 'Phone' },
  { path: 'gender', label: 'Gender' },
  { path: 'staffCode', label: 'Staff code' },
  { path: 'dateOfBirth', label: 'Date of birth' },
  { path: 'designation', label: 'Designation' },
] as const satisfies readonly AuditField[];

type StaffRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Staff not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: StaffRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getStaffByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetStaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: StaffRouteContext) {
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
    const before = await getStaffByIdQuery(id, tenantSession.tenantId);
    const result = await updateStaffCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'staff_changed', {
      profile_kind: 'staff',
      action: 'updated',
    });

    await recordAuditEvent(tenantSession, request, 'user.update', {
      entityId: result.data.id,
      entityLabel: result.data.email,
      changes: before.success
        ? diffAuditFields(before.data, result.data, STAFF_AUDIT_FIELDS)
        : null,
    });

    return NextResponse.json<UpdateStaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
