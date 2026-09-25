import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { TherapistScheduleOverlapError } from '../errors/therapist-schedule-overlap-error';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import type { TherapistSchedule } from '../schemas/therapist-schedule-schema';
import { validateCreateTherapistSchedule } from '../validator/create-therapist-schedule-validator';

function constraintErrors(error: unknown) {
  const dbError = error && typeof error === 'object' && 'cause' in error ? error.cause : error;
  if (!dbError || typeof dbError !== 'object' || !('code' in dbError) || dbError.code !== '23505')
    return [];
  return 'constraint' in dbError && dbError.constraint === 'therapist_schedule_rota_active_idx'
    ? ['Therapist schedule contains duplicate rotas.']
    : ['Therapist schedule conflicts with an existing record.'];
}

export async function createTherapistScheduleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<TherapistSchedule>> {
  const validation = await validateCreateTherapistSchedule(payload, tenantId);
  if (!validation.success) return validation;

  try {
    const data = await therapistScheduleRepository.createTherapistSchedule({
      ...validation.data,
      tenantId,
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof TherapistScheduleOverlapError) {
      return { success: false, status: StatusCodes.CONFLICT, errors: [error.message] };
    }
    const errors = constraintErrors(error);
    if (errors.length) return { success: false, status: StatusCodes.CONFLICT, errors };
    throw error;
  }
}
