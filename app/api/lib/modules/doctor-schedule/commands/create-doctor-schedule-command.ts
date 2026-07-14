import type { CommandResult } from '@/app/api/lib/utils/types';
import { StatusCodes } from 'http-status-codes';
import { DoctorScheduleOverlapError } from '../errors/doctor-schedule-overlap-error';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import type { DoctorSchedule } from '../schemas/doctor-schedule-schema';
import { validateCreateDoctorSchedule } from '../validator/create-doctor-schedule-validator';

function getDoctorScheduleUniqueConstraintErrors(error: unknown) {
  const dbError = error && typeof error === 'object' && 'cause' in error ? error.cause : error;

  if (!dbError || typeof dbError !== 'object' || !('code' in dbError)) {
    return [];
  }

  if (dbError.code !== '23505') {
    return [];
  }

  if ('constraint' in dbError && dbError.constraint === 'doctor_schedule_rota_active_idx') {
    return ['Doctor schedule contains duplicate Doctor rotas.'];
  }

  return ['Doctor schedule conflicts with an existing record.'];
}

export async function createDoctorScheduleCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<DoctorSchedule>> {
  const validationResult = await validateCreateDoctorSchedule(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdSchedule = await doctorScheduleRepository.createDoctorSchedule({
      ...validationResult.data,
      tenantId,
    });

    return { success: true, data: createdSchedule };
  } catch (error) {
    if (error instanceof DoctorScheduleOverlapError) {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: [error.message],
      };
    }

    const constraintErrors = getDoctorScheduleUniqueConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return {
        success: false,
        errors: constraintErrors,
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }
}
