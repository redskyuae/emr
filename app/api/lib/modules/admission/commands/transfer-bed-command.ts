import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateTransferBed } from '../validator/transfer-bed-validator';

export async function transferBedCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Admission>> {
  const validationResult = await validateTransferBed(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const { id: admissionId, payload: input } = validationResult.data;

  try {
    const result = await admissionRepository.transferBed(
      admissionId,
      tenantId,
      input.toBedId,
      input.reason
    );

    if (result.outcome === 'not-found') {
      return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
    }

    if (result.outcome === 'invalid-status') {
      return {
        success: false,
        errors: [
          `Admission ${result.data.admissionNumber} cannot be transferred from its current status.`,
        ],
        status: StatusCodes.CONFLICT,
      };
    }

    if (result.outcome === 'same-bed') {
      return {
        success: false,
        errors: [
          `Admission ${result.data.admissionNumber} is already in bed ${result.data.bed.bedNumber}.`,
        ],
        status: StatusCodes.CONFLICT,
      };
    }

    if (result.outcome === 'bed-not-available') {
      return {
        success: false,
        errors: ['Bed is not available for admission.'],
        status: StatusCodes.CONFLICT,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (dbError?.code === '23505' && dbError.constraint === 'admission_active_bed_idx') {
      return {
        success: false,
        errors: ['Bed is not available for admission.'],
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }
}
