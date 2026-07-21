import { z } from 'zod';

// Server upload cap. Next.js serverless request bodies top out around 4.5MB, so
// a file larger than this can never have reached Blob through our upload route.
export const MAX_VISIT_DOCUMENT_BYTES = 4.5 * 1024 * 1024;

// Clinical documents are scans, referrals, and prior reports — PDFs and images.
export const ACCEPTED_VISIT_DOCUMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/tiff',
] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const positiveIdSchema = (fieldName: string) =>
  z.coerce
    .number({ error: `${fieldName} is required` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be positive`);

export const visitDocumentIdSchema = positiveIdSchema('Document ID');
export const visitDocumentTenantIdSchema = tenantIdSchema;
export const visitDocumentVisitIdSchema = positiveIdSchema('Visit ID');

// The metadata a client sends back after uploading a file to Blob. The URL must
// be a Blob URL we handed out; we do not accept arbitrary external URLs.
export const visitDocumentMetadataSchema = z.object({
  fileName: z
    .string({ error: 'File name is required' })
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name must be at most 255 characters'),
  fileUrl: z
    .string({ error: 'File URL is required' })
    .trim()
    .min(1, 'File URL is required')
    .max(2048, 'File URL must be at most 2048 characters')
    .url('File URL must be a valid URL'),
  contentType: z
    .string({ error: 'Content type is required' })
    .trim()
    .min(1, 'Content type is required')
    .max(150, 'Content type must be at most 150 characters'),
  fileSize: z.coerce
    .number({ error: 'File size is required' })
    .int('File size must be an integer')
    .positive('File size must be positive')
    .max(MAX_VISIT_DOCUMENT_BYTES, 'File must be at most 4.5MB'),
});

export type VisitDocumentMetadata = z.infer<typeof visitDocumentMetadataSchema>;

export type ValidatedAddVisitDocumentData = VisitDocumentMetadata & {
  tenantId: string;
  visitId: number;
};

export type ListVisitDocumentsParams = {
  tenantId: string;
  visitId: number;
};

export type DeleteVisitDocumentParams = {
  tenantId: string;
  visitId: number;
  documentId: number;
};

export type VisitDocument = {
  id: number;
  visitId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  createdOn: Date;
};
