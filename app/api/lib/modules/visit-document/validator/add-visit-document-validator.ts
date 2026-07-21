import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitRepository } from '../../visit/repository/visit-repository';
import {
  visitDocumentMetadataSchema,
  visitDocumentTenantIdSchema,
  visitDocumentVisitIdSchema,
  type ValidatedAddVisitDocumentData,
} from '../schemas/visit-document-schema';

export async function validateAddVisitDocument(
  visitId: unknown,
  tenantId: unknown,
  payload: unknown
): Promise<ValidationResult<ValidatedAddVisitDocumentData>> {
  const tenantIdResult = visitDocumentTenantIdSchema.safeParse(tenantId);
  const visitIdResult = visitDocumentVisitIdSchema.safeParse(visitId);
  const payloadResult = visitDocumentMetadataSchema.safeParse(payload);

  if (!tenantIdResult.success || !visitIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const visit = await visitRepository.getVisitById(visitIdResult.data, tenantIdResult.data);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  // A closed Visit is a historical record; documents attach only to an Active
  // Visit still being written up (ADR 0027).
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    return {
      success: false,
      errors: [`Visit ${visit.visitNumber} is closed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      tenantId: tenantIdResult.data,
      visitId: visitIdResult.data,
      fileName: payloadResult.data.fileName,
      fileUrl: payloadResult.data.fileUrl,
      contentType: payloadResult.data.contentType,
      fileSize: payloadResult.data.fileSize,
    },
  };
}
