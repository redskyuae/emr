import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListDoctorSlotsResponse } from './types';

import { getDoctorSlotsQuery } from '@/app/api/lib/modules/doctor-schedule/queries/get-doctor-slots-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const doctorId = request.nextUrl.searchParams.get('doctorId') ?? undefined;
    const slotDate = request.nextUrl.searchParams.get('slotDate') ?? undefined;

    const queryResult = await getDoctorSlotsQuery({
      tenantId: tenantSession.tenantId,
      doctorId,
      slotDate,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<ListDoctorSlotsResponse>({ data: queryResult.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
