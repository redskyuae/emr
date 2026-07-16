import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { clinicalNoteIdSchema, clinicalNoteTenantIdSchema } from '../schemas/clinical-note-schema';

export type DeleteClinicalNoteInput = {
  id: number;
  tenantId: string;
};

export async function validateDeleteClinicalNote(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteClinicalNoteInput>> {
  const idResult = clinicalNoteIdSchema.safeParse(id);
  const tenantIdResult = clinicalNoteTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Clinical note ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const existing = await clinicalNoteRepository.getClinicalNoteById(
    idResult.data,
    tenantIdResult.data
  );

  if (!existing) {
    return { success: false, errors: ['Clinical note not found'], status: StatusCodes.NOT_FOUND };
  }

  // Signed notes are an immutable clinical record — they cannot be deleted,
  // matching the update/sign guards.
  if (existing.status === 'signed') {
    return {
      success: false,
      errors: [`Clinical note ${idResult.data} is signed and cannot be deleted.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
