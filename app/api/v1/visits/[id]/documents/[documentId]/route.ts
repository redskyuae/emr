import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { deleteVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/delete-visit-document-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type VisitDocumentRouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors.length === 1 ? errors[0] : 'Not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function DELETE(_request: NextRequest, context: VisitDocumentRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, documentId } = await context.params;
    const result = await deleteVisitDocumentCommand(id, documentId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
