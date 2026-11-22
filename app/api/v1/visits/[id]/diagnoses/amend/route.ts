import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { amendVisitDiagnosesCommand } from '@/app/api/lib/modules/visit-diagnosis/commands/amend-visit-diagnoses-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { listVisitDiagnosesQuery } from '@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query';
import { diagnosisAuditMetadata } from '@/app/api/lib/audit/audit-diagnosis-metadata';
import type { SaveVisitDiagnosesResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitAmendedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type AmendVisitDiagnosesRouteContext = {
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

export async function PUT(request: NextRequest, context: AmendVisitDiagnosesRouteContext) {
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
    // Read before writing so the Audit Event can name the codes added and removed.
    const before = await listVisitDiagnosesQuery(id, tenantSession.tenantId);
    const result = await amendVisitDiagnosesCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_amended', () =>
      visitAmendedProperties('diagnoses', result.visitCompletedAt)
    );

    const visit = await getVisitByIdQuery(id, tenantSession.tenantId);

    await recordAuditEvent(tenantSession, request, 'visit-diagnosis.amend', {
      entityId: id,
      visitId: visit.success ? visit.data.id : null,
      patientId: visit.success ? visit.data.patient.id : null,
      entityLabel: visit.success ? visit.data.visitNumber : null,
      metadata: before.success ? diagnosisAuditMetadata(before.data, result.data) : null,
    });

    return NextResponse.json<SaveVisitDiagnosesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
