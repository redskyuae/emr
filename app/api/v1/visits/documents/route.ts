import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { UploadVisitDocumentResponse } from './types';

import {
  ACCEPTED_VISIT_DOCUMENT_TYPES,
  MAX_VISIT_DOCUMENT_BYTES,
} from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import { uploadVisitDocument } from '@/app/api/lib/storage/visit-document-storage';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

const ACCEPTED_TYPES = new Set<string>(ACCEPTED_VISIT_DOCUMENT_TYPES);

// Uploads a single file to Blob and returns its URL and metadata. Persisting the
// document against a Visit is a separate step (check-in payload or POST
// /visits/{id}/documents), so this route touches no database.
export async function POST(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: 'Request must be multipart/form-data with a file field' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: 'A non-empty file is required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (file.size > MAX_VISIT_DOCUMENT_BYTES) {
      return NextResponse.json(
        { message: 'File must be at most 4.5MB' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: 'File must be a PDF or an image (PNG, JPEG, WEBP, GIF, TIFF)' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Without a Blob token @vercel/blob throws an opaque error; surface the real
    // cause so the operator knows the store still needs configuring.
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { message: 'Document storage is not configured. Set BLOB_READ_WRITE_TOKEN.' },
        { status: StatusCodes.SERVICE_UNAVAILABLE }
      );
    }

    const uploaded = await uploadVisitDocument(tenantSession.tenantId, file);

    return NextResponse.json<UploadVisitDocumentResponse>(
      { data: uploaded },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
