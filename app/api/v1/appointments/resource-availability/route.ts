import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getProcedureResourceAvailabilityQuery } from '@/app/api/lib/modules/appointment/queries/get-procedure-resource-availability-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { GetProcedureResourceAvailabilityResponse } from './types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;

    const searchParams = request.nextUrl.searchParams;
    const result = await getProcedureResourceAvailabilityQuery(
      {
        slotDate: searchParams.get('slotDate'),
        startTime: searchParams.get('startTime'),
        endTime: searchParams.get('endTime'),
        patientId: searchParams.get('patientId') ?? undefined,
      },
      session.tenantId
    );

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<GetProcedureResourceAvailabilityResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
