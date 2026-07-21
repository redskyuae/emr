import type { CommandResult } from '@/app/api/lib/utils/types';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import type { VisitDocument } from '../schemas/visit-document-schema';
import { validateAddVisitDocument } from '../validator/add-visit-document-validator';

export async function addVisitDocumentCommand(
  visitId: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<VisitDocument>> {
  const validationResult = await validateAddVisitDocument(visitId, tenantId, payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const created = await visitDocumentRepository.addDocument(validationResult.data);

  return { success: true, data: created };
}
