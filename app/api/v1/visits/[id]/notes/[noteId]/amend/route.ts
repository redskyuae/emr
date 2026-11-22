import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { amendVisitClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/amend-visit-clinical-note-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { CLINICAL_NOTE_AUDIT_FIELDS, diffAuditFields } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getClinicalNoteByIdQuery } from '@/app/api/lib/modules/clinical-note/queries/get-clinical-note-by-id-query';
import type { AmendVisitClinicalNoteResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitAmendedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

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
    // Read before writing so the Audit Event can carry the before/after.
    const before = await getClinicalNoteByIdQuery(noteId, tenantSession.tenantId);
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

    recordLifecycleEvent(tenantSession, request, 'visit_amended', () =>
      visitAmendedProperties('clinical_note', result.visitCompletedAt)
    );

    await recordAuditEvent(tenantSession, request, 'clinical-note.amend', {
      entityId: result.data.id,
      visitId: result.data.visitId,
      patientId: result.data.patientId,
      changes: before.success
        ? diffAuditFields(before.data, result.data, CLINICAL_NOTE_AUDIT_FIELDS)
        : null,
    });

    return NextResponse.json<AmendVisitClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
