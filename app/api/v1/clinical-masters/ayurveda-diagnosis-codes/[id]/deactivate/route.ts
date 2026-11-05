import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateAyurvedaDiagnosisCodeResponse } from './types';

import { deactivateAyurvedaDiagnosisCodeCommand } from '@/app/api/lib/modules/ayurveda-diagnosis-code/commands/deactivate-ayurveda-diagnosis-code-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type AyurvedaDiagnosisCodeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: AyurvedaDiagnosisCodeRouteContext) {
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
    const result = await deactivateAyurvedaDiagnosisCodeCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message:
            status === StatusCodes.NOT_FOUND
              ? 'Ayurveda diagnosis code not found'
              : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    return NextResponse.json<DeactivateAyurvedaDiagnosisCodeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
