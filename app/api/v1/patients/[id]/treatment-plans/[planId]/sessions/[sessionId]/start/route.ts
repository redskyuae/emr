import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { startPatientTreatmentPlanSessionCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/start-patient-treatment-plan-session-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { StartPatientTreatmentPlanSessionResponse } from './types';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]/start'>
) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'patient-treatment-plan:read',
      'patient-treatment-plan:start',
    ]);

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

    const { id, planId, sessionId } = await context.params;
    const result = await startPatientTreatmentPlanSessionCommand(
      {
        patientId: id,
        tenantId: tenantSession.tenantId,
        patientTreatmentPlanId: planId,
        patientTreatmentPlanSessionId: sessionId,
      },
      payload
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message =
        status === StatusCodes.NOT_FOUND
          ? (result.errors[0] ?? 'Not found')
          : status === StatusCodes.CONFLICT
            ? 'Conflict'
            : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<StartPatientTreatmentPlanSessionResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
