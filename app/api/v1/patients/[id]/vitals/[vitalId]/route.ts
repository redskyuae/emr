import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetPatientVitalSignResponse, UpdatePatientVitalSignResponse } from './types';

import { deletePatientVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/delete-patient-vital-sign-command';
import { updatePatientVitalSignCommand } from '@/app/api/lib/modules/patient-vital-sign/commands/update-patient-vital-sign-command';
import { getPatientVitalSignByIdQuery } from '@/app/api/lib/modules/patient-vital-sign/queries/get-patient-vital-sign-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { diffAuditFields, VITAL_SIGN_AUDIT_FIELDS } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

type PatientVitalSignRouteContext = {
  params: Promise<{ id: string; vitalId: string }>;
};

function vitalSignAuditTarget(vitalSign: PatientVitalSign) {
  return { entityId: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId };
}

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Vital sign not found';
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: PatientVitalSignRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, vitalId } = await context.params;
    const result = await getPatientVitalSignByIdQuery(vitalId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    if (result.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Vital sign not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json<GetPatientVitalSignResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: PatientVitalSignRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, vitalId } = await context.params;

    const owned = await getPatientVitalSignByIdQuery(vitalId, tenantSession.tenantId);
    if (!owned.success || owned.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Vital sign not found' },
        { status: StatusCodes.NOT_FOUND }
      );
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

    const result = await updatePatientVitalSignCommand(vitalId, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    // `owned` is the reading as it was before the update.
    await recordAuditEvent(tenantSession, request, 'vital-sign.update', {
      ...vitalSignAuditTarget(result.data),
      changes: diffAuditFields(owned.data, result.data, VITAL_SIGN_AUDIT_FIELDS),
    });

    return NextResponse.json<UpdatePatientVitalSignResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: PatientVitalSignRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, vitalId } = await context.params;

    const owned = await getPatientVitalSignByIdQuery(vitalId, tenantSession.tenantId);
    if (!owned.success || owned.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Vital sign not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const result = await deletePatientVitalSignCommand(vitalId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(
      tenantSession,
      request,
      'vital-sign.delete',
      vitalSignAuditTarget(owned.data)
    );

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
