import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';

const CLINICAL_NOTE_TYPE_NAME_EXISTS = "Clinical note type name '{value}' already exists.";
const CLINICAL_NOTE_TYPE_CODE_EXISTS = "Clinical note type code '{value}' already exists.";

type ClinicalNoteTypeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateClinicalNoteTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: ClinicalNoteTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    clinicalNoteTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    clinicalNoteTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(CLINICAL_NOTE_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(CLINICAL_NOTE_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getClinicalNoteTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<ClinicalNoteTypeUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'clinical_note_type_tenant_name_idx') {
    return [duplicateError(CLINICAL_NOTE_TYPE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'clinical_note_type_tenant_code_idx') {
    return [duplicateError(CLINICAL_NOTE_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
