import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { GetBedBoardResponse } from './types';

import { getBedBoardQuery } from '@/app/api/lib/modules/bed/queries/get-bed-board-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET() {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const result = await getBedBoardQuery(tenantSession.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<GetBedBoardResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
