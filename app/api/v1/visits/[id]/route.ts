import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetVisitResponse, UpdateVisitResponse } from './types';

import { deleteVisitCommand } from '@/app/api/lib/modules/visit/commands/delete-visit-command';
import { updateVisitCommand } from '@/app/api/lib/modules/visit/commands/update-visit-command';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { diffAuditFields, VISIT_AUDIT_FIELDS } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type VisitRouteContext = {
  params: Promise<{ id: string }>;
};

function visitAuditTarget(visit: Visit) {
  return {
    entityId: visit.id,
    visitId: visit.id,
    patientId: visit.patient.id,
    entityLabel: visit.visitNumber,
  };
}

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Visit not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest, context: VisitRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getVisitByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'visit.view', visitAuditTarget(result.data));

    return NextResponse.json<GetVisitResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: VisitRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

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
    const before = await getVisitByIdQuery(id, tenantSession.tenantId);
    const result = await updateVisitCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'visit.update', {
      ...visitAuditTarget(result.data),
      changes: before.success
        ? diffAuditFields(before.data, result.data, VISIT_AUDIT_FIELDS)
        : null,
    });

    return NextResponse.json<UpdateVisitResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: VisitRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const before = await getVisitByIdQuery(id, tenantSession.tenantId);
    const result = await deleteVisitCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(
      tenantSession,
      request,
      'visit.delete',
      before.success ? visitAuditTarget(before.data) : { entityId: id }
    );

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
