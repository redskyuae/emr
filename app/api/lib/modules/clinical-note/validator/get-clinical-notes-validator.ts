import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { clinicalNoteIdSchema, clinicalNoteTenantIdSchema } from '../schemas/clinical-note-schema';

export type GetClinicalNotesInput = {
  patientId: number;
  tenantId: string;
};

export function validateGetClinicalNotes(
  patientId: unknown,
  tenantId: unknown
): ValidationResult<GetClinicalNotesInput> {
  const patientIdResult = clinicalNoteIdSchema.safeParse(patientId);
  const tenantIdResult = clinicalNoteTenantIdSchema.safeParse(tenantId);

  if (!patientIdResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { patientId: patientIdResult.data, tenantId: tenantIdResult.data },
  };
}
