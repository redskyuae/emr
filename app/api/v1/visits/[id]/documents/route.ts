import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { AddVisitDocumentResponse, ListVisitDocumentsResponse } from './types';

import { addVisitDocumentCommand } from '@/app/api/lib/modules/visit-document/commands/add-visit-document-command';
import { listVisitDocumentsQuery } from '@/app/api/lib/modules/visit-document/queries/list-visit-documents-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { visitDocumentProperties } from '@/app/api/lib/analytics/lifecycle-visit-properties';

type VisitDocumentsRouteContext = {
  params: Promise<{ id: string }>;
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

export async function GET(_request: NextRequest, context: VisitDocumentsRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'visit-document:read',
    ]);

    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await context.params;
    const result = await listVisitDocumentsQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ListVisitDocumentsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest, context: VisitDocumentsRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'visit-document:upload',
    ]);

    if (permissionResponse) {
      return permissionResponse;
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

    const result = await addVisitDocumentCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'visit_document_added', () =>
      visitDocumentProperties(result.data)
    );

    // The Visit supplies the Patient; the file name is recorded, never its contents or URL.
    await recordAuditEvent(tenantSession, request, 'visit-document.add', async () => {
      const visit = await getVisitByIdQuery(id, tenantSession.tenantId);

      return {
        entityId: result.data.id,
        visitId: result.data.visitId,
        patientId: visit.success ? visit.data.patient.id : null,
        entityLabel: result.data.fileName,
        metadata: { contentType: result.data.contentType, fileSize: result.data.fileSize },
      };
    });

    return NextResponse.json<AddVisitDocumentResponse>(
      { data: result.data },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
