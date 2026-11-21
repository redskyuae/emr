import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ReactivateTherapistResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { reactivateTherapistCommand } from '@/app/api/lib/modules/therapist/commands/reactivate-therapist-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type RouteContext = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireTenantAdminSession();
    if (session instanceof Response) return session;
    const result = await reactivateTherapistCommand((await context.params).id, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'Therapist not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }
    recordServerEvent(analyticsActorFromSession(session, request), 'staff_changed', {
      profile_kind: 'therapist',
      action: 'reactivated',
    });

    return NextResponse.json<ReactivateTherapistResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
