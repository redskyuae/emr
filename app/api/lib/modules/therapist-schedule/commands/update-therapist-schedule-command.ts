import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { TherapistScheduleOverlapError } from '../errors/therapist-schedule-overlap-error';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import type { TherapistSchedule } from '../schemas/therapist-schedule-schema';
import { validateUpdateTherapistSchedule } from '../validator/update-therapist-schedule-validator';

export async function updateTherapistScheduleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<TherapistSchedule>> {
  const validation = await validateUpdateTherapistSchedule(payload, tenantId);
  if (!validation.success) return validation;

  try {
    const data = await therapistScheduleRepository.updateTherapistSchedule(validation.data.id, {
      ...validation.data.payload,
      tenantId,
    });
    return data
      ? { success: true, data }
      : {
          success: false,
          status: StatusCodes.NOT_FOUND,
          errors: ['Therapist schedule not found'],
        };
  } catch (error) {
    if (error instanceof TherapistScheduleOverlapError) {
      return { success: false, status: StatusCodes.CONFLICT, errors: [error.message] };
    }
    const dbError = error && typeof error === 'object' && 'cause' in error ? error.cause : error;
    if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === '23505') {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Therapist schedule contains duplicate rotas.'],
      };
    }
    throw error;
  }
}
