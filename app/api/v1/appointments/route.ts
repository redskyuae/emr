import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { createAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/create-appointment-command';
import { getAppointmentsQuery } from '@/app/api/lib/modules/appointment/queries/get-appointments-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { CreateAppointmentResponse, ListAppointmentsResponse } from './types';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = parsePositiveInteger(searchParams.get('limit'), 10);
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getAppointmentsQuery({
      tenantId: tenantSession.tenantId,
      filters: {
        slotDate: searchParams.get('slotDate')?.trim() || undefined,
        doctorId: searchParams.get('doctorId')?.trim() || undefined,
        patientId: searchParams.get('patientId')?.trim() || undefined,
        appointmentStatusId: searchParams.get('appointmentStatusId')?.trim() || undefined,
        query: searchParams.get('query')?.trim() || searchParams.get('search')?.trim() || undefined,
        page: safePage,
        limit: safeLimit,
      },
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    if (!('total' in queryResult)) {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }

    const { data, total } = queryResult;
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    return NextResponse.json<ListAppointmentsResponse>({
      data,
      meta: {
        total,
        totalPages,
        pageSize: safeLimit,
        pageNumber: safePage,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const createPermissionResponse = await requireTenantPermissions(tenantSession, [
      'appointment:create',
    ]);

    if (createPermissionResponse) {
      return createPermissionResponse;
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

    if (isProcedurePayload(payload)) {
      const selection = classifyProcedureSelection(payload);

      if (selection === 'INVALID') {
        return invalidProcedureSelectionResponse();
      }

      const procedurePermission =
        selection === 'EXISTING_PLAN'
          ? 'patient-treatment-plan:read'
          : 'patient-treatment-plan:assign';
      const procedurePermissionResponse = await requireTenantPermissions(tenantSession, [
        procedurePermission,
      ]);

      if (procedurePermissionResponse) {
        return procedurePermissionResponse;
      }
    }

    const result = await createAppointmentCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed',
          errors: result.errors,
          ...(result.patientMatches ? { patientMatches: result.patientMatches } : {}),
        },
        { status }
      );
    }

    return NextResponse.json<CreateAppointmentResponse>(
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProcedurePayload(payload: unknown): payload is Record<string, unknown> {
  return isRecord(payload) && payload.bookingPath === 'PROCEDURE';
}

function classifyProcedureSelection(
  payload: Record<string, unknown>
): 'EXISTING_PLAN' | 'CATALOGUE' | 'INVALID' {
  const hasPlanId = Object.hasOwn(payload, 'patientTreatmentPlanId');
  const hasPlanSessionId = Object.hasOwn(payload, 'patientTreatmentPlanSessionId');
  const hasTreatmentId = Object.hasOwn(payload, 'treatmentId');
  const hasTotalSessions = Object.hasOwn(payload, 'totalSessions');

  if (hasPlanId && hasPlanSessionId && !hasTreatmentId && !hasTotalSessions) {
    return 'EXISTING_PLAN';
  }

  if (hasTreatmentId && !hasPlanId && !hasPlanSessionId) {
    return 'CATALOGUE';
  }

  return 'INVALID';
}

function invalidProcedureSelectionResponse() {
  return NextResponse.json(
    {
      message: 'Validation failed',
      errors: [
        'Procedure selection must identify exactly one Patient Treatment Plan Session or catalogue Treatment.',
      ],
    },
    { status: StatusCodes.BAD_REQUEST }
  );
}
