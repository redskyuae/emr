import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteVisitDocumentBlob } from '@/app/api/lib/storage/visit-document-storage';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateAddVisitDocument } from '../validator/add-visit-document-validator';
import { validateDeleteVisitDocument } from '../validator/delete-visit-document-validator';
import { addVisitDocumentCommand } from './add-visit-document-command';
import { deleteVisitDocumentCommand } from './delete-visit-document-command';

vi.mock('../repository/visit-document-repository', () => ({
  visitDocumentRepository: { addDocument: vi.fn(), deleteDocument: vi.fn() },
}));
vi.mock('../validator/add-visit-document-validator', () => ({ validateAddVisitDocument: vi.fn() }));
vi.mock('../validator/delete-visit-document-validator', () => ({
  validateDeleteVisitDocument: vi.fn(),
}));
vi.mock('@/app/api/lib/storage/visit-document-storage', () => ({
  deleteVisitDocumentBlob: vi.fn(),
}));

const repo = vi.mocked(visitDocumentRepository);
const validateAdd = vi.mocked(validateAddVisitDocument);
const validateDelete = vi.mocked(validateDeleteVisitDocument);
const deleteBlob = vi.mocked(deleteVisitDocumentBlob);

const metadata = {
  fileName: 'referral.pdf',
  fileUrl: 'https://blob.vercel-storage.com/x/referral-abc.pdf',
  contentType: 'application/pdf',
  fileSize: 2048,
};
const document = { id: 4, visitId: 9, ...metadata, createdOn: new Date() } as VisitDocument;

describe('Visit document commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAdd.mockResolvedValue({
      success: true,
      data: { tenantId: 'tenant-1', visitId: 9, ...metadata },
    });
    validateDelete.mockResolvedValue({
      success: true,
      data: { tenantId: 'tenant-1', visitId: 9, documentId: 4 },
    });
    repo.addDocument.mockResolvedValue(document);
    repo.deleteDocument.mockResolvedValue(document);
    deleteBlob.mockResolvedValue();
  });

  describe('addVisitDocumentCommand', () => {
    it('should not write when validation fails', async () => {
      validateAdd.mockResolvedValue({ success: false, errors: ['Visit not found'], status: 404 });

      await expect(addVisitDocumentCommand(9, 'tenant-1', metadata)).resolves.toMatchObject({
        success: false,
        status: 404,
      });
      expect(repo.addDocument).not.toHaveBeenCalled();
    });

    it('should persist the validated data and return the created document', async () => {
      await expect(addVisitDocumentCommand(9, 'tenant-1', metadata)).resolves.toEqual({
        success: true,
        data: document,
      });
      expect(repo.addDocument).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        visitId: 9,
        ...metadata,
      });
    });
  });

  describe('deleteVisitDocumentCommand', () => {
    it('should not delete when validation fails', async () => {
      validateDelete.mockResolvedValue({
        success: false,
        errors: ['Visit not found'],
        status: 404,
      });

      await expect(deleteVisitDocumentCommand(9, 4, 'tenant-1')).resolves.toMatchObject({
        success: false,
      });
      expect(repo.deleteDocument).not.toHaveBeenCalled();
      expect(deleteBlob).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the delete', async () => {
      repo.deleteDocument.mockResolvedValue(undefined);

      await expect(deleteVisitDocumentCommand(9, 4, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
      expect(deleteBlob).not.toHaveBeenCalled();
    });

    it('should remove the underlying blob and return the deleted document', async () => {
      await expect(deleteVisitDocumentCommand(9, 4, 'tenant-1')).resolves.toEqual({
        success: true,
        data: document,
      });
      expect(deleteBlob).toHaveBeenCalledWith(document.fileUrl);
    });
  });
});
