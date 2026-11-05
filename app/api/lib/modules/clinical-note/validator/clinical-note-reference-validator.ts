import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { ayurvedaDiagnosisCodeRepository } from '../../ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
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

type DiagnosisCodeReferences = {
  diagnosisCodeId?: number | null;
  ayurvedaDiagnosisCodeId?: number | null;
};

function invalidReference(error: string): ValidationResult<void> {
  return { success: false, errors: [error], status: StatusCodes.BAD_REQUEST };
}

// Deactivation only stops new selections, so a note that already carries a code may keep it.
export async function validateDiagnosisCodeReferences(
  { diagnosisCodeId, ayurvedaDiagnosisCodeId }: DiagnosisCodeReferences,
  tenantId: string,
  existing?: DiagnosisCodeReferences
): Promise<ValidationResult<void>> {
  if (diagnosisCodeId && diagnosisCodeId !== existing?.diagnosisCodeId) {
    const code = await diagnosisCodeRepository.getDiagnosisCodeById(diagnosisCodeId, tenantId);

    if (!code) {
      return invalidReference(`Diagnosis code ${diagnosisCodeId} does not exist.`);
    }

    if (!code.isActive) {
      return invalidReference(`Diagnosis code ${code.code} is inactive.`);
    }
  }

  if (ayurvedaDiagnosisCodeId && ayurvedaDiagnosisCodeId !== existing?.ayurvedaDiagnosisCodeId) {
    const code = await ayurvedaDiagnosisCodeRepository.getAyurvedaDiagnosisCodeById(
      ayurvedaDiagnosisCodeId,
      tenantId
    );

    if (!code) {
      return invalidReference(`Ayurveda diagnosis code ${ayurvedaDiagnosisCodeId} does not exist.`);
    }

    if (!code.isActive) {
      return invalidReference(`Ayurveda diagnosis code ${code.code} is inactive.`);
    }
  }

  return { success: true, data: undefined };
}
