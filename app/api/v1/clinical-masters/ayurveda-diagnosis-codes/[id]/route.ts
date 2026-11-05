import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type {
  GetAyurvedaDiagnosisCodeResponse,
  UpdateAyurvedaDiagnosisCodeResponse,
} from './types';

import { deleteAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/delete-ayurveda-diagnosis-code-command';
import { updateAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/update-ayurveda-diagnosis-code-command';
import { getAyurvedaDiagnosisCodeByIdQuery } from '@/app/api/lib/modules/ayurveda-diagnosis-code/queries/get-ayurveda-diagnosis-code-by-id-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type AyurvedaDiagnosisCodeRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Ayurveda diagnosis code not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: AyurvedaDiagnosisCodeRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getAyurvedaDiagnosisCodeByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetAyurvedaDiagnosisCodeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: AyurvedaDiagnosisCodeRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const forbidden = await requireTenantPermissions(tenantSession, [
      'ayurveda-diagnosis-code:update',
    ]);

    if (forbidden) {
      return forbidden;
    }

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await updateAyurvedaDiagnosisCodeCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdateAyurvedaDiagnosisCodeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: AyurvedaDiagnosisCodeRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const forbidden = await requireTenantPermissions(tenantSession, [
      'ayurveda-diagnosis-code:delete',
    ]);

    if (forbidden) {
      return forbidden;
    }

    const { id } = await context.params;
    const result = await deleteAyurvedaDiagnosisCodeCommand(id, tenantSession.tenantId);

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
