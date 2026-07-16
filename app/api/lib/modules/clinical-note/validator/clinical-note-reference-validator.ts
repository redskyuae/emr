import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';

export async function validatePatientExistsForNote(
  patientId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const patient = await patientRepository.getPatientById(patientId, tenantId);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: undefined };
}

export async function validateNoteTypeReference(
  noteTypeId: number,
  tenantId: string
): Promise<ValidationResult<void>> {
  const noteType = await clinicalNoteTypeRepository.getClinicalNoteTypeById(noteTypeId, tenantId);

  if (!noteType) {
    return {
      success: false,
      errors: [`Clinical note type ${noteTypeId} does not exist.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  return { success: true, data: undefined };
}
