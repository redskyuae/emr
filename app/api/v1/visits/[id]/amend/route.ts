import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { diffAuditFields, VISIT_AUDIT_FIELDS } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { amendVisitCommand } from '@/app/api/lib/modules/visit/commands/amend-visit-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AmendVisitResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitAmendedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type AmendVisitRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Visit not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function PUT(request: NextRequest, context: AmendVisitRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, ['visit:amend']);

    if (permissionResponse) {
      return permissionResponse;
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const { id } = await context.params;
    // Read before writing so the Audit Event can carry the before/after.
    const before = await getVisitByIdQuery(id, tenantSession.tenantId);
    const result = await amendVisitCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_amended', () =>
      visitAmendedProperties('visit', result.data.completedAt)
    );

    await recordAuditEvent(tenantSession, request, 'visit.amend', {
      entityId: result.data.id,
      visitId: result.data.id,
      patientId: result.data.patient.id,
      entityLabel: result.data.visitNumber,
      changes: before.success
        ? diffAuditFields(before.data, result.data, VISIT_AUDIT_FIELDS)
        : null,
    });

    return NextResponse.json<AmendVisitResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
