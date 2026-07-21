import type { UploadedVisitDocument } from '@/app/api/lib/storage/visit-document-storage';

// The metadata returned after a file is uploaded to Blob. Clients send these
// fields back when persisting the document against a Visit (at check-in or on
// the Visit detail page).
export type UploadVisitDocumentResponse = {
  data: UploadedVisitDocument;
};
