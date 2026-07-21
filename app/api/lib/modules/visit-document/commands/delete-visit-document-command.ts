import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { deleteVisitDocumentBlob } from '@/app/api/lib/storage/visit-document-storage';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateDeleteVisitDocument } from '../validator/delete-visit-document-validator';

export async function deleteVisitDocumentCommand(
  visitId: unknown,
  documentId: unknown,
  tenantId: string
): Promise<CommandResult<VisitDocument>> {
  const validationResult = await validateDeleteVisitDocument(visitId, documentId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const deleted = await visitDocumentRepository.deleteDocument(
    validationResult.data.documentId,
    validationResult.data.tenantId
  );

  if (!deleted) {
    return { success: false, errors: ['Document not found'], status: StatusCodes.NOT_FOUND };
  }

  // The row is gone as far as the app is concerned; free the underlying blob too.
  await deleteVisitDocumentBlob(deleted.fileUrl);

  return { success: true, data: deleted };
}
