import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListPatientMedicationsResponse, SavePatientMedicationResponse } from './types';

import { createPatientMedicationCommand } from '@/app/api/lib/modules/patient-medication/commands/create-patient-medication-command';
import { getPatientMedicationsQuery } from '@/app/api/lib/modules/patient-medication/queries/get-patient-medications-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

type PatientMedicationsRouteContext = {
  params: Promise<{ id: string }>;
};

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors[0] ?? 'Not found';
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest, context: PatientMedicationsRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 100);
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getPatientMedicationsQuery({
      patientId: id,
      tenantId: tenantSession.tenantId,
      page: safePage,
      limit: safeLimit,
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

    return NextResponse.json<ListPatientMedicationsResponse>({
      data,
      meta: { total, totalPages, pageSize: safeLimit, pageNumber: safePage },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest, context: PatientMedicationsRouteContext) {
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

    const result = await createPatientMedicationCommand(
      id,
      tenantSession.tenantId,
      tenantSession.session.user.id,
      payload
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SavePatientMedicationResponse>(
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
