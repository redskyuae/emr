import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetVisitStatusCountsResponse } from './types';

import { getVisitStatusCountsQuery } from '@/app/api/lib/modules/visit/queries/get-visit-status-counts-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;

    const denied = await requireTenantPermissions(session, ['visit:read']);
    if (denied) return denied;

    const searchParams = request.nextUrl.searchParams;
    const result = await getVisitStatusCountsQuery({
      tenantId: session.tenantId,
      filters: {
        visitDate: searchParams.get('visitDate')?.trim() || undefined,
        doctorId: searchParams.get('doctorId')?.trim() || undefined,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<GetVisitStatusCountsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
