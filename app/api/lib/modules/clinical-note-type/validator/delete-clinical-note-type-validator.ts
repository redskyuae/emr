import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  clinicalNoteTypeIdSchema,
  clinicalNoteTypeTenantIdSchema,
} from '../schemas/clinical-note-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type DeleteClinicalNoteTypeInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteClinicalNoteType(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteClinicalNoteTypeInput> {
  const idResult = clinicalNoteTypeIdSchema.safeParse(id);
  const tenantIdResult = clinicalNoteTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Clinical note type ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
