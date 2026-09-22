import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateTherapistResponse } from './types';

import { deactivateTherapistCommand } from '@/app/api/lib/modules/therapist/commands/deactivate-therapist-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type RouteContext = { params: Promise<{ id: string }> };
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireTenantAdminSession();
    if (session instanceof Response) return session;
    const result = await deactivateTherapistCommand((await context.params).id, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        {
          message:
            status === StatusCodes.NOT_FOUND
              ? 'Therapist not found'
              : result.errors.length === 1
                ? result.errors[0]
                : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }
    return NextResponse.json<DeactivateTherapistResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
