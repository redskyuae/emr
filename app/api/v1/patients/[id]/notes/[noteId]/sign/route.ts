import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { SignClinicalNoteResponse } from './types';

import { signClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/sign-clinical-note-command';
import { getClinicalNoteByIdQuery } from '@/app/api/lib/modules/clinical-note/queries/get-clinical-note-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { clinicalNoteSignedProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type SignClinicalNoteRouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Clinical note not found';
  }

  return status === StatusCodes.CONFLICT ? (errors[0] ?? 'Conflict') : 'Validation failed';
}

export async function POST(request: NextRequest, context: SignClinicalNoteRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, noteId } = await context.params;

    const owned = await getClinicalNoteByIdQuery(noteId, tenantSession.tenantId);
    if (!owned.success || owned.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Clinical note not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    const result = await signClinicalNoteCommand(noteId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    await recordAuditEvent(tenantSession, request, 'clinical-note.sign', {
      entityId: result.data.id,
      visitId: result.data.visitId,
      patientId: result.data.patientId,
    });

    recordLifecycleEvent(tenantSession, request, 'clinical_note_signed', () =>
      clinicalNoteSignedProperties(result.data, result.noteTypeCode)
    );

    return NextResponse.json<SignClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
