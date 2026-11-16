import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { amendVisitClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/amend-visit-clinical-note-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { AmendVisitClinicalNoteResponse } from './types';

type AmendVisitClinicalNoteRouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors[0] ?? 'Not found';
  }

  return status === StatusCodes.CONFLICT ? (errors[0] ?? 'Conflict') : 'Validation failed';
}

export async function PUT(request: NextRequest, context: AmendVisitClinicalNoteRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, ['visit:amend']);

    if (permissionResponse) {
      return permissionResponse;
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

    const { id, noteId } = await context.params;
    const result = await amendVisitClinicalNoteCommand(
      id,
      noteId,
      tenantSession.tenantId,
      payload,
      tenantSession.session.user.id
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AmendVisitClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
