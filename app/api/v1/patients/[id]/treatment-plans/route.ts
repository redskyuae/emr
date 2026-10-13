import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { addPatientTreatmentPlanSessionsCommand } from '@/app/api/lib/modules/patient-treatment-plan/commands/add-patient-treatment-plan-sessions-command';
import { getPatientTreatmentPlansQuery } from '@/app/api/lib/modules/patient-treatment-plan/queries/get-patient-treatment-plans-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type {
  AddPatientTreatmentPlanSessionsResponse,
  ListPatientTreatmentPlansResponse,
} from './types';

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans'>
) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'patient-treatment-plan:read',
    ]);

    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await context.params;
    const result = await getPatientTreatmentPlansQuery(
      id,
      tenantSession.tenantId,
      request.nextUrl.searchParams.get('status')
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = status === StatusCodes.NOT_FOUND ? 'Patient not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<ListPatientTreatmentPlansResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans'>
) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'patient-treatment-plan:read',
      'patient-treatment-plan:assign',
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

    const { id } = await context.params;
    const result = await addPatientTreatmentPlanSessionsCommand(
      id,
      tenantSession.tenantId,
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

    return NextResponse.json<AddPatientTreatmentPlanSessionsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
