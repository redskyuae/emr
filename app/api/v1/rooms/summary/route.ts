import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { GetRoomSummaryResponse } from './types';

import { getRoomSummaryQuery } from '@/app/api/lib/modules/room/queries/get-room-summary-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET() {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const result = await getRoomSummaryQuery(tenantSession.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<GetRoomSummaryResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
