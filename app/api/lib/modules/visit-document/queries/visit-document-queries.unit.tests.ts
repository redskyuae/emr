import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateListVisitDocuments } from '../validator/list-visit-documents-validator';
import { listVisitDocumentsQuery } from './list-visit-documents-query';

vi.mock('../repository/visit-document-repository', () => ({
  visitDocumentRepository: { listByVisit: vi.fn() },
}));
vi.mock('../validator/list-visit-documents-validator', () => ({
  validateListVisitDocuments: vi.fn(),
}));

const repo = vi.mocked(visitDocumentRepository);
const validateList = vi.mocked(validateListVisitDocuments);

const document = { id: 4, visitId: 9 } as VisitDocument;

describe('Visit document queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateList.mockResolvedValue({ success: true, data: { tenantId: 'tenant-1', visitId: 9 } });
    repo.listByVisit.mockResolvedValue([document]);
  });

  describe('listVisitDocumentsQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateList.mockResolvedValue({ success: false, errors: ['Visit not found'], status: 404 });

      await expect(listVisitDocumentsQuery('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
      expect(repo.listByVisit).not.toHaveBeenCalled();
    });

    it('should return the documents for the visit', async () => {
      await expect(listVisitDocumentsQuery(9, 'tenant-1')).resolves.toEqual({
        success: true,
        data: [document],
        total: 1,
      });
      expect(repo.listByVisit).toHaveBeenCalledWith('tenant-1', 9);
    });
  });
});
