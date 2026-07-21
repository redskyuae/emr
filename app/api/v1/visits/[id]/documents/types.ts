import type {
  VisitDocument,
  VisitDocumentMetadata,
} from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';

export type ListVisitDocumentsResponse = {
  data: VisitDocument[];
};

// The Blob metadata returned by POST /visits/documents, sent back to persist the
// document against this Visit.
export type AddVisitDocumentRequest = VisitDocumentMetadata;

export type AddVisitDocumentResponse = {
  data: VisitDocument;
};
