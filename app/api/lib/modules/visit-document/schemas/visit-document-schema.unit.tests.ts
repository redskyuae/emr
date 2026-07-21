import { describe, expect, it } from 'vitest';

import { MAX_VISIT_DOCUMENT_BYTES, visitDocumentMetadataSchema } from './visit-document-schema';

const errorsOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validMetadata = {
  fileName: 'referral.pdf',
  fileUrl: 'https://blob.vercel-storage.com/tenants/t1/visit-documents/referral-abc.pdf',
  contentType: 'application/pdf',
  fileSize: 2048,
};

describe('Visit document schema', () => {
  describe('visitDocumentMetadataSchema', () => {
    it('should accept valid document metadata', () => {
      expect(visitDocumentMetadataSchema.parse(validMetadata)).toEqual(validMetadata);
    });

    it('should trim the file name', () => {
      expect(
        visitDocumentMetadataSchema.parse({ ...validMetadata, fileName: '  scan.png  ' }).fileName
      ).toBe('scan.png');
    });

    it('should require a file name', () => {
      expect(
        errorsOf(visitDocumentMetadataSchema.safeParse({ ...validMetadata, fileName: '' }))
      ).toContain('File name is required');
    });

    it('should reject a file name longer than 255 characters', () => {
      expect(
        errorsOf(
          visitDocumentMetadataSchema.safeParse({ ...validMetadata, fileName: 'a'.repeat(256) })
        )
      ).toContain('File name must be at most 255 characters');
    });

    it('should reject a non-URL file URL', () => {
      expect(
        errorsOf(visitDocumentMetadataSchema.safeParse({ ...validMetadata, fileUrl: 'not-a-url' }))
      ).toContain('File URL must be a valid URL');
    });

    it('should require a content type', () => {
      expect(
        errorsOf(visitDocumentMetadataSchema.safeParse({ ...validMetadata, contentType: '' }))
      ).toContain('Content type is required');
    });

    it('should reject a non-positive file size', () => {
      expect(
        errorsOf(visitDocumentMetadataSchema.safeParse({ ...validMetadata, fileSize: 0 }))
      ).toContain('File size must be positive');
    });

    it('should reject a file larger than the 4.5MB cap', () => {
      expect(
        errorsOf(
          visitDocumentMetadataSchema.safeParse({
            ...validMetadata,
            fileSize: MAX_VISIT_DOCUMENT_BYTES + 1,
          })
        )
      ).toContain('File must be at most 4.5MB');
    });
  });
});
