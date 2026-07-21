import { del, put } from '@vercel/blob';

import type { VisitDocumentMetadata } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';

// The upload result is exactly the metadata a client persists back against a
// Visit (check-in payload or POST /visits/{id}/documents), so callers can pass it
// straight through without reshaping.
export type UploadedVisitDocument = VisitDocumentMetadata;

// Blob is addressed by pathname; scoping by tenant keeps one Tenant's files from
// ever colliding with another's, and the random suffix avoids clobbering when two
// uploads share a filename.
function documentPathname(tenantId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 200) || 'document';
  return `tenants/${tenantId}/visit-documents/${safeName}`;
}

export async function uploadVisitDocument(
  tenantId: string,
  file: File
): Promise<UploadedVisitDocument> {
  const contentType = file.type || 'application/octet-stream';

  const blob = await put(documentPathname(tenantId, file.name), file, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });

  return {
    fileName: file.name,
    fileUrl: blob.url,
    contentType,
    fileSize: file.size,
  };
}

// Best-effort: a Visit document row is soft-deleted regardless, so a failure to
// remove the underlying blob must not fail the delete. The orphaned blob can be
// swept later.
export async function deleteVisitDocumentBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Swallow — the DB row is the source of truth for what a Visit shows.
  }
}
