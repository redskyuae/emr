import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { getAppointmentTypeUniqueConstraintErrors } from '../validator/appointment-type-uniqueness-validator';
import { validateCreateAppointmentType } from '../validator/create-appointment-type-validator';

export async function createAppointmentTypeCommand(
  payload: unknown
): Promise<CommandResult<AppointmentType>> {
  const validationResult = await validateCreateAppointmentType(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdAppointmentType = await appointmentTypeRepository.createAppointmentType(
      validationResult.data
    );
    return { success: true, data: createdAppointmentType };
  } catch (error) {
    const constraintErrors = getAppointmentTypeUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
