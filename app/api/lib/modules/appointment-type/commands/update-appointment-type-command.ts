import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateAppointmentTypeUniqueConstraint } from '../validator/appointment-type-uniqueness-validator';
import { validateUpdateAppointmentType } from '../validator/update-appointment-type-validator';

const NOT_FOUND_STATUS = 404;

export async function updateAppointmentTypeCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentType>> {
  const validationResult = await validateUpdateAppointmentType(id, payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const updatedAppointmentType = await appointmentTypeRepository.updateAppointmentType(
      validationResult.data.id,
      validationResult.data.payload
    );

    if (!updatedAppointmentType) {
      return {
        success: false,
        errors: ['Appointment type not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentType };
  } catch (error) {
    const constraintValidationResult = validateAppointmentTypeUniqueConstraint(error);

    if (constraintValidationResult) {
      return constraintValidationResult;
    }

    throw error;
  }
}
