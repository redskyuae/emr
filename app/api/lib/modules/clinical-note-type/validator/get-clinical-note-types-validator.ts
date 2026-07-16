import type { ValidationResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeTenantIdSchema } from '../schemas/clinical-note-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetClinicalNoteTypes(tenantId: unknown): ValidationResult<string> {
  const result = clinicalNoteTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
