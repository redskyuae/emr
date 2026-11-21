import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { clinicalNoteIdSchema, clinicalNoteTenantIdSchema } from '../schemas/clinical-note-schema';

export type SignClinicalNoteInput = {
  id: number;
  tenantId: string;
  /** The note type's code, reported with the signature; not written. Null if the type is gone. */
  noteTypeCode: string | null;
};

export async function validateSignClinicalNote(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<SignClinicalNoteInput>> {
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

  if (existing.status === 'signed') {
    return {
      success: false,
      errors: [`Clinical note ${idResult.data} is already signed.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const noteType = await clinicalNoteTypeRepository.getClinicalNoteTypeById(
    existing.noteTypeId,
    tenantIdResult.data
  );

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
      noteTypeCode: noteType?.code ?? null,
    },
  };
}
