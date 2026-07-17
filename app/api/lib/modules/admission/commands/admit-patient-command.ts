import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateAdmitPatient } from '../validator/admit-patient-validator';

export async function admitPatientCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Admission>> {
  const validationResult = await validateAdmitPatient(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const data = validationResult.data;

  try {
    const result = await admissionRepository.admitPatient(data);

    if (result.success) {
      return result;
    }

    return {
      success: false,
      errors: [`Bed ${data.bedNumber} is not available for admission.`],
      status: StatusCodes.CONFLICT,
    };
  } catch (error) {
    const dbError = getDatabaseError(error);

    // The validator already rejects these; the indexes catch the race between
    // two concurrent admits that both passed validation (ADR 0034).
    if (dbError?.code === '23505') {
      if (dbError.constraint === 'admission_active_patient_idx') {
        return {
          success: false,
          errors: [`Patient ${data.patientId} already has an active admission.`],
          status: StatusCodes.CONFLICT,
        };
      }

      if (dbError.constraint === 'admission_active_bed_idx') {
        return {
          success: false,
          errors: [`Bed ${data.bedNumber} is not available for admission.`],
          status: StatusCodes.CONFLICT,
        };
      }

      if (dbError.constraint === 'admission_tenant_number_idx') {
        return {
          success: false,
          errors: ['Admission Number allocation conflicted. Please retry.'],
          status: StatusCodes.CONFLICT,
        };
      }
    }

    throw error;
  }
}
