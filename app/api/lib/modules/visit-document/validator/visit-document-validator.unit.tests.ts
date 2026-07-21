import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../../visit/repository/visit-repository';
import type { Visit } from '../../visit/schemas/visit-schema';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateAddVisitDocument } from './add-visit-document-validator';
import { validateDeleteVisitDocument } from './delete-visit-document-validator';
import { validateListVisitDocuments } from './list-visit-documents-validator';

vi.mock('../../visit/repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('../repository/visit-document-repository', () => ({
  visitDocumentRepository: { findById: vi.fn() },
}));

const visitRepo = vi.mocked(visitRepository);
const documentRepo = vi.mocked(visitDocumentRepository);

const activeVisit = { id: 9, visitNumber: 'VST-1001', status: 'CHECKED_IN' } as Visit;
const document = { id: 4, visitId: 9 } as VisitDocument;

const validMetadata = {
  fileName: 'referral.pdf',
  fileUrl: 'https://blob.vercel-storage.com/tenants/t1/visit-documents/referral-abc.pdf',
  contentType: 'application/pdf',
  fileSize: 2048,
};

describe('Visit document validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitRepo.getVisitById.mockResolvedValue(activeVisit);
    documentRepo.findById.mockResolvedValue(document);
  });

  describe('validateAddVisitDocument', () => {
    it('should reject an invalid visit id without touching the repository', async () => {
      const result = await validateAddVisitDocument('abc', 'tenant-1', validMetadata);

      expect(result).toMatchObject({ success: false, errors: ['Visit abc is Invalid.'] });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should reject invalid metadata without touching the repository', async () => {
      const result = await validateAddVisitDocument(9, 'tenant-1', {
        ...validMetadata,
        fileUrl: 'not-a-url',
      });

      expect(result.success).toBe(false);
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit is missing', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateAddVisitDocument(9, 'tenant-1', validMetadata)).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should reject attaching to a closed visit', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...activeVisit, status: 'COMPLETED' } as Visit);

      await expect(validateAddVisitDocument(9, 'tenant-1', validMetadata)).resolves.toEqual({
        success: false,
        errors: ['Visit VST-1001 is closed and cannot be edited.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return the validated data on success', async () => {
      await expect(validateAddVisitDocument(9, 'tenant-1', validMetadata)).resolves.toEqual({
        success: true,
        data: { tenantId: 'tenant-1', visitId: 9, ...validMetadata },
      });
    });
  });

  describe('validateListVisitDocuments', () => {
    it('should reject a blank tenant without touching the repository', async () => {
      const result = await validateListVisitDocuments(9, '  ');

      expect(result.success).toBe(false);
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit is missing', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateListVisitDocuments(9, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the tenant and visit on success', async () => {
      await expect(validateListVisitDocuments(9, 'tenant-1')).resolves.toEqual({
        success: true,
        data: { tenantId: 'tenant-1', visitId: 9 },
      });
    });
  });

  describe('validateDeleteVisitDocument', () => {
    it('should reject an invalid document id', async () => {
      const result = await validateDeleteVisitDocument(9, 'abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Document abc is Invalid.'] });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit is missing', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateDeleteVisitDocument(9, 4, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
      expect(documentRepo.findById).not.toHaveBeenCalled();
    });

    it('should reject deleting from a closed visit', async () => {
      visitRepo.getVisitById.mockResolvedValue({ ...activeVisit, status: 'CANCELLED' } as Visit);

      await expect(validateDeleteVisitDocument(9, 4, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return not found when the document belongs to another visit', async () => {
      documentRepo.findById.mockResolvedValue({ id: 4, visitId: 999 } as VisitDocument);

      await expect(validateDeleteVisitDocument(9, 4, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Document not found'],
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the identifiers on success', async () => {
      await expect(validateDeleteVisitDocument(9, 4, 'tenant-1')).resolves.toEqual({
        success: true,
        data: { tenantId: 'tenant-1', visitId: 9, documentId: 4 },
      });
    });
  });
});
