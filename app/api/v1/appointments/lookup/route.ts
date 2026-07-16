import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { LookupAppointmentResponse } from './types';

import { getAppointmentByBookingNumberQuery } from '@/app/api/lib/modules/appointment/queries/get-appointment-by-booking-number-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const bookingNumber = request.nextUrl.searchParams.get('bookingNumber')?.trim();
    const result = await getAppointmentByBookingNumberQuery(bookingNumber, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'Appointment not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    return NextResponse.json<LookupAppointmentResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
