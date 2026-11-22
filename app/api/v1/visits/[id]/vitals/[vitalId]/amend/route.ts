import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { amendVisitVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/amend-visit-vital-sign-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { diffAuditFields, VITAL_SIGN_AUDIT_FIELDS } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getPatientVitalSignByIdQuery } from '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query';
import type { AmendVisitVitalSignResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitAmendedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type AmendVisitVitalSignRouteContext = {
  params: Promise<{ id: string; vitalId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors[0] ?? 'Not found';
  }

  return status === StatusCodes.CONFLICT ? (errors[0] ?? 'Conflict') : 'Validation failed';
}

export async function PUT(request: NextRequest, context: AmendVisitVitalSignRouteContext) {
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

    const { id, vitalId } = await context.params;
    // Read before writing so the Audit Event can carry the before/after.
    const before = await getPatientVitalSignByIdQuery(vitalId, tenantSession.tenantId);
    const result = await amendVisitVitalSignCommand(id, vitalId, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_amended', () =>
      visitAmendedProperties('vital_sign', result.visitCompletedAt)
    );

    await recordAuditEvent(tenantSession, request, 'vital-sign.amend', {
      entityId: result.data.id,
      visitId: result.data.visitId,
      patientId: result.data.patientId,
      changes: before.success
        ? diffAuditFields(before.data, result.data, VITAL_SIGN_AUDIT_FIELDS)
        : null,
    });

    return NextResponse.json<AmendVisitVitalSignResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
