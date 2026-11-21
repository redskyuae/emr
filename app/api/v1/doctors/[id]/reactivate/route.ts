import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ReactivateDoctorResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { reactivateDoctorCommand } from '@/app/api/lib/modules/doctor/commands/reactivate-doctor-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type DoctorRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: DoctorRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await reactivateDoctorCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'Doctor not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'staff_changed', {
      profile_kind: 'doctor',
      action: 'reactivated',
    });

    return NextResponse.json<ReactivateDoctorResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
