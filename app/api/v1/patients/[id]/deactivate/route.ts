import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivatePatientResponse } from './types';

import { deactivatePatientCommand } from '@/app/api/lib/modules/patient/commands/deactivate-patient-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

type PatientRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Patient not found';
  }

  return 'Validation failed';
}

export async function PATCH(request: NextRequest, context: PatientRouteContext) {
  try {
    // Any authenticated Tenant member may deactivate a Patient — see the note on
    // POST in ../../route.ts for why this isn't requireTenantAdminSession.
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deactivatePatientCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'patient.deactivate', {
      entityId: result.data.id,
      patientId: result.data.id,
      entityLabel: result.data.mrn,
    });

    recordLifecycleEvent(tenantSession, request, 'patient_deactivated', () => ({}));

    return NextResponse.json<DeactivatePatientResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
