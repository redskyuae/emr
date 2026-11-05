import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateDiagnosisCodeResponse } from './types';

import { deactivateDiagnosisCodeCommand } from '@/app/api/lib/modules/diagnosis-code/commands/deactivate-diagnosis-code-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type DiagnosisCodeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: DiagnosisCodeRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const forbidden = await requireTenantPermissions(tenantSession, ['diagnosis-code:update']);

    if (forbidden) {
      return forbidden;
    }

    const { id } = await context.params;
    const result = await deactivateDiagnosisCodeCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message:
            status === StatusCodes.NOT_FOUND ? 'Diagnosis code not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    return NextResponse.json<DeactivateDiagnosisCodeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
