import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetVisitPatientTypeResponse } from './types';

import { getVisitPatientTypeQuery } from '@/app/api/lib/modules/visit/queries/get-visit-patient-type-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;

    const result = await getVisitPatientTypeQuery(
      request.nextUrl.searchParams.get('patientId'),
      session.tenantId
    );
    if (!result.success) {
      return NextResponse.json(
        { message: result.errors[0], errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }
    return NextResponse.json<GetVisitPatientTypeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
