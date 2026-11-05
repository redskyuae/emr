import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { assignPatientTreatmentPlanCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/assign-patient-treatment-plan-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AssignPatientTreatmentPlanResponse } from './types';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans/assign'>
) {
  try {
    const tenantSession = await requireTenantSession();
    if (tenantSession instanceof Response) return tenantSession;

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'patient-treatment-plan:read',
      'patient-treatment-plan:assign',
    ]);
    if (permissionResponse) return permissionResponse;

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
    const result = await assignPatientTreatmentPlanCommand(id, tenantSession.tenantId, payload);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: result.errors[0] ?? 'Validation failed', errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<AssignPatientTreatmentPlanResponse>(
      { data: result.data },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
