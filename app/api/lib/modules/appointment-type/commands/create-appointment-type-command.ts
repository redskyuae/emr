import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { getAppointmentTypeUniqueConstraintErrors } from '../validator/appointment-type-uniqueness-validator';
import { validateCreateAppointmentType } from '../validator/create-appointment-type-validator';

const CONFLICT_STATUS = 409;

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
    const constraintErrors = getAppointmentTypeUniqueConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
