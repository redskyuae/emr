import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { saveVisitDiagnosesCommand } from '@/app/api/lib/modules/visit-diagnosis/commands/save-visit-diagnoses-command';
import { listVisitDiagnosesQuery } from '@/app/api/lib/modules/visit-diagnosis/queries/list-visit-diagnoses-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { diagnosisAuditMetadata } from '@/app/api/lib/audit/audit-diagnosis-metadata';
import type { ListVisitDiagnosesResponse, SaveVisitDiagnosesResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitDiagnosesSavedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type VisitDiagnosesRouteContext = {
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

export async function GET(_request: NextRequest, context: VisitDiagnosesRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await listVisitDiagnosesQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ListVisitDiagnosesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: VisitDiagnosesRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, ['visit:update']);

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
    const result = await saveVisitDiagnosesCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_diagnoses_saved', () =>
      visitDiagnosesSavedProperties(result.data)
    );

    await recordAuditEvent(tenantSession, request, 'visit-diagnosis.save', async () => {
      const visit = await getVisitByIdQuery(id, tenantSession.tenantId);

      return {
        entityId: id,
        visitId: visit.success ? visit.data.id : null,
        patientId: visit.success ? visit.data.patient.id : null,
        entityLabel: visit.success ? visit.data.visitNumber : null,
        metadata: before.success ? diagnosisAuditMetadata(before.data, result.data) : null,
      };
    });

    return NextResponse.json<SaveVisitDiagnosesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
