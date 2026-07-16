import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetPatientMedicationResponse, UpdatePatientMedicationResponse } from './types';

import { deletePatientMedicationCommand } from '@/app/api/lib/modules/patient-medication/commands/delete-patient-medication-command';
import { updatePatientMedicationCommand } from '@/app/api/lib/modules/patient-medication/commands/update-patient-medication-command';
import { getPatientMedicationByIdQuery } from '@/app/api/lib/modules/patient-medication/queries/get-patient-medication-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type PatientMedicationRouteContext = {
  params: Promise<{ id: string; medicationId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Medication not found';
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: PatientMedicationRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, medicationId } = await context.params;
    const result = await getPatientMedicationByIdQuery(medicationId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    if (result.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Medication not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json<GetPatientMedicationResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: PatientMedicationRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, medicationId } = await context.params;

    const owned = await getPatientMedicationByIdQuery(medicationId, tenantSession.tenantId);
    if (!owned.success || owned.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Medication not found' },
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

    const result = await updatePatientMedicationCommand(
      medicationId,
      tenantSession.tenantId,
      payload
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdatePatientMedicationResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: PatientMedicationRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, medicationId } = await context.params;

    const owned = await getPatientMedicationByIdQuery(medicationId, tenantSession.tenantId);
    if (!owned.success || owned.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Medication not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const result = await deletePatientMedicationCommand(medicationId, tenantSession.tenantId);

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
