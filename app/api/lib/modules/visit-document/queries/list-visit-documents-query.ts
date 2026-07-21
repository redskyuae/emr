import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateListVisitDocuments } from '../validator/list-visit-documents-validator';

export async function listVisitDocumentsQuery(
  visitId: unknown,
  tenantId: unknown
): Promise<ListQueryResult<VisitDocument>> {
  const validationResult = await validateListVisitDocuments(visitId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const documents = await visitDocumentRepository.listByVisit(
    validationResult.data.tenantId,
    validationResult.data.visitId
  );

  return { success: true, data: documents, total: documents.length };
}
