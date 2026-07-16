import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteIdSchema, clinicalNoteTenantIdSchema } from '../schemas/clinical-note-schema';

export type GetClinicalNoteByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetClinicalNoteById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetClinicalNoteByIdInput> {
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

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
