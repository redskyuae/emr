import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getPatientTimelineQuery } from '@/app/api/lib/modules/patient-timeline/queries/get-patient-timeline-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { GetPatientTimelineResponse } from './types';

type PatientTimelineRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: PatientTimelineRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    const result = await getPatientTimelineQuery(id, tenantSession.tenantId, {
      feed: searchParams.get('feed') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    });

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = status === StatusCodes.NOT_FOUND ? 'Patient not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<GetPatientTimelineResponse>(result.data);
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
