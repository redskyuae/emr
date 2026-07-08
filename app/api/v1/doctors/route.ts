import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListDoctorsResponse, SaveDoctorResponse } from './types';

import { createDoctorCommand } from '@/app/api/lib/modules/doctor/commands/create-doctor-command';
import { getDoctorsQuery } from '@/app/api/lib/modules/doctor/queries/get-doctors-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors.includes('Doctor role not found') ? 'Doctor role not found' : 'Doctor not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;
    const specialtyIdParam = request.nextUrl.searchParams.get('specialtyId');
    const parsedSpecialtyId = specialtyIdParam ? Number(specialtyIdParam) : Number.NaN;
    const specialtyId =
      Number.isInteger(parsedSpecialtyId) && parsedSpecialtyId > 0 ? parsedSpecialtyId : undefined;
    const statusParam = request.nextUrl.searchParams.get('status');
    const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const result = await getDoctorsQuery({
      page: safePage,
      limit: safeLimit,
      query,
      status,
      tenantId: tenantSession.tenantId,
      specialtyId,
    });

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    const totalPages = result.total > 0 ? Math.ceil(result.total / safeLimit) : 0;

    return NextResponse.json<ListDoctorsResponse>({
      data: result.data,
      meta: {
        total: result.total,
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
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
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

    const result = await createDoctorCommand(
      payload,
      tenantSession.tenantId,
      tenantSession.session.user.id
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveDoctorResponse>(
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
