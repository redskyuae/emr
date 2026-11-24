import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetClinicalNoteResponse, UpdateClinicalNoteResponse } from './types';

import { deleteClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/delete-clinical-note-command';
import { updateClinicalNoteCommand } from '@/app/api/lib/modules/clinical-note/commands/update-clinical-note-command';
import { getClinicalNoteByIdQuery } from '@/app/api/lib/modules/clinical-note/queries/get-clinical-note-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { CLINICAL_NOTE_AUDIT_FIELDS, diffAuditFields } from '@/app/api/lib/audit/audit-changes';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';

type ClinicalNoteRouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

function noteAuditTarget(note: ClinicalNote) {
  return { entityId: note.id, visitId: note.visitId, patientId: note.patientId };
}

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Clinical note not found';
  }

  return status === StatusCodes.CONFLICT ? (errors[0] ?? 'Conflict') : 'Validation failed';
}

export async function GET(_request: NextRequest, context: ClinicalNoteRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, noteId } = await context.params;
    const result = await getClinicalNoteByIdQuery(noteId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    if (result.data.patientId !== Number(id)) {
      return NextResponse.json(
        { message: 'Clinical note not found' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    return NextResponse.json<GetClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: ClinicalNoteRouteContext) {
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

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await updateClinicalNoteCommand(noteId, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    // `owned` is the note as it was before the update.
    await recordAuditEvent(tenantSession, request, 'clinical-note.update', {
      ...noteAuditTarget(result.data),
      changes: diffAuditFields(owned.data, result.data, CLINICAL_NOTE_AUDIT_FIELDS),
    });

    return NextResponse.json<UpdateClinicalNoteResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: ClinicalNoteRouteContext) {
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

    const result = await deleteClinicalNoteCommand(noteId, tenantSession.tenantId);

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
      'clinical-note.delete',
      noteAuditTarget(owned.data)
    );

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
