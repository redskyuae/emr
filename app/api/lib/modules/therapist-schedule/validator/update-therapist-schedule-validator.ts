import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { therapistRepository } from '../../therapist/repository/therapist-repository';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import {
  updateTherapistScheduleSchema,
  type UpdateTherapistScheduleInput,
} from '../schemas/therapist-schedule-schema';

export async function validateUpdateTherapistSchedule(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateTherapistScheduleInput>> {
  const result = updateTherapistScheduleSchema.safeParse(payload);
  if (!result.success) return { success: false, errors: formatValidationErrors(result.error) };

  const existingSchedule = await therapistScheduleRepository.getTherapistScheduleById(
    result.data.id,
    tenantId
  );
  if (!existingSchedule) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Therapist schedule not found'],
    };
  }

  if (result.data.payload.therapistId !== undefined) {
    const therapist = await therapistRepository.getTherapistById(
      result.data.payload.therapistId,
      tenantId
    );
    if (!therapist || !therapist.isActive) {
      return {
        success: false,
        errors: [`Therapist ${result.data.payload.therapistId} is Invalid.`],
      };
    }
  }

  if (result.data.payload.rotaIds !== undefined) {
    const activeRotaCount = await therapistScheduleRepository.getActiveRotaCount(
      tenantId,
      result.data.payload.rotaIds
    );
    if (activeRotaCount !== new Set(result.data.payload.rotaIds).size) {
      return { success: false, errors: ['One or more rotas are invalid.'] };
    }
  }
  return { success: true, data: result.data };
}
