import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { deleteVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/delete-visit-document-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitDocumentProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type VisitDocumentRouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return errors.length === 1 ? errors[0] : 'Not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function DELETE(request: NextRequest, context: VisitDocumentRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id, documentId } = await context.params;
    const result = await deleteVisitDocumentCommand(id, documentId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_document_removed', () =>
      visitDocumentProperties(result.data)
    );

    // The Visit supplies the Patient; the file name is recorded, never its contents or URL.
    await recordAuditEvent(tenantSession, request, 'visit-document.delete', async () => {
      const visit = await getVisitByIdQuery(id, tenantSession.tenantId);

      return {
        entityId: result.data.id,
        visitId: result.data.visitId,
        patientId: visit.success ? visit.data.patient.id : null,
        entityLabel: result.data.fileName,
        metadata: { contentType: result.data.contentType, fileSize: result.data.fileSize },
      };
    });

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
