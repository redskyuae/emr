import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { SignClinicalNoteResponse } from './types';

import { signClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/sign-clinical-note-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type SignClinicalNoteRouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Clinical note not found';
  }

  return status === StatusCodes.CONFLICT ? (errors[0] ?? 'Conflict') : 'Validation failed';
}

export async function POST(_request: NextRequest, context: SignClinicalNoteRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { noteId } = await context.params;
    const result = await signClinicalNoteCommand(noteId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SignClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
