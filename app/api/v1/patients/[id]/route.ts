import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetPatientResponse, UpdatePatientResponse } from './types';

import { deletePatientCommand } from '@/app/api/lib/modules/patient/commands/delete-patient-command';
import { updatePatientCommand } from '@/app/api/lib/modules/patient/commands/update-patient-command';
import { getPatientByIdQuery } from '@/app/api/lib/modules/patient/queries/get-patient-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { diffAuditFields, PATIENT_AUDIT_FIELDS } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import {
  patientRegisteredProperties,
  registrationPathAfterUpdate,
} from '@/app/api/lib/analytics/lifecycle-patient-properties';

type PatientRouteContext = {
  params: Promise<{ id: string }>;
};

function patientAuditTarget(patient: Patient) {
  return { entityId: patient.id, patientId: patient.id, entityLabel: patient.mrn };
}

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Patient not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest, context: PatientRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getPatientByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'patient.view', patientAuditTarget(result.data));

    return NextResponse.json<GetPatientResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: PatientRouteContext) {
  try {
    // Any authenticated Tenant member may update a Patient — see the note on POST
    // in ../route.ts for why this isn't requireTenantAdminSession.
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
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

    // Read before writing so the Audit Event can carry the before/after.
    const before = await getPatientByIdQuery(id, tenantSession.tenantId);
    const result = await updatePatientCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'patient.update', {
      ...patientAuditTarget(result.data),
      changes: before.success
        ? diffAuditFields(before.data, result.data, PATIENT_AUDIT_FIELDS)
        : null,
    });

    const registrationPath = registrationPathAfterUpdate(
      result.previousRegistrationStatus,
      result.data
    );

    if (registrationPath) {
      recordLifecycleEvent(tenantSession, request, 'patient_registered', () =>
        patientRegisteredProperties(result.data, registrationPath)
      );
    }

    return NextResponse.json<UpdatePatientResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: PatientRouteContext) {
  try {
    // Any authenticated Tenant member may delete a Patient — see the note on POST
    // in ../route.ts for why this isn't requireTenantAdminSession.
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const before = await getPatientByIdQuery(id, tenantSession.tenantId);
    const result = await deletePatientCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(
      tenantSession,
      request,
      'patient.delete',
      before.success ? patientAuditTarget(before.data) : { entityId: id }
    );

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
