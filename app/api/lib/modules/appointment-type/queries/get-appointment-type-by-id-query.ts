import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateGetAppointmentTypeById } from '../validator/get-appointment-type-by-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getAppointmentTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AppointmentType>> {
  const validationResult = validateGetAppointmentTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const appointmentType = await appointmentTypeRepository.getAppointmentTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!appointmentType) {
    return {
      success: false,
      errors: ['Appointment type not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: appointmentType };
}
