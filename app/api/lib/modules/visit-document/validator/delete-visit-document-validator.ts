import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitRepository } from '../../visit/repository/visit-repository';
import { visitDocumentRepository } from '../repository/visit-document-repository';
import {
  visitDocumentIdSchema,
  visitDocumentTenantIdSchema,
  visitDocumentVisitIdSchema,
  type DeleteVisitDocumentParams,
} from '../schemas/visit-document-schema';

export async function validateDeleteVisitDocument(
  visitId: unknown,
  documentId: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteVisitDocumentParams>> {
  const tenantIdResult = visitDocumentTenantIdSchema.safeParse(tenantId);
  const visitIdResult = visitDocumentVisitIdSchema.safeParse(visitId);
  const documentIdResult = visitDocumentIdSchema.safeParse(documentId);

  if (!tenantIdResult.success || !visitIdResult.success || !documentIdResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    if (!documentIdResult.success) {
      errors.push(`Document ${String(documentId)} is Invalid.`);
    }

    return { success: false, errors };
  }

  const visit = await visitRepository.getVisitById(visitIdResult.data, tenantIdResult.data);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    return {
      success: false,
      errors: [`Visit ${visit.visitNumber} is closed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const document = await visitDocumentRepository.findById(
    documentIdResult.data,
    tenantIdResult.data
  );

  // Scope the document to the Visit in the path so a document cannot be deleted
  // through an unrelated Visit's URL.
  if (!document || document.visitId !== visitIdResult.data) {
    return { success: false, errors: ['Document not found'], status: StatusCodes.NOT_FOUND };
  }

  return {
    success: true,
    data: {
      tenantId: tenantIdResult.data,
      visitId: visitIdResult.data,
      documentId: documentIdResult.data,
    },
  };
}
