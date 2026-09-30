import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { createDoctorScheduleSchema } from '../schemas/doctor-schedule-schema';
import type { CreateDoctorScheduleInput } from '../schemas/doctor-schedule-schema';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';

export async function validateCreateDoctorSchedule(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateDoctorScheduleInput>> {
  const result = createDoctorScheduleSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const tenant = await tenantRepository.getTenantById(tenantId);

  if (!tenant) {
    return { success: false, errors: ['Tenant not found'] };
  }

  const today = tenantLocalDateTime(new Date(), tenant.timeZone).date;
  const dateErrors = [
    ...(result.data.slotFromDate < today ? ['Slot from date cannot be in the past.'] : []),
    ...(result.data.slotToDate < today ? ['Slot to date cannot be in the past.'] : []),
  ];

  if (dateErrors.length > 0) {
    return { success: false, errors: dateErrors };
  }

  const doctor = await doctorRepository.getDoctorById(result.data.doctorId, tenantId);

  if (!doctor || !doctor.isActive) {
    return {
      success: false,
      errors: [`Doctor ${result.data.doctorId} is Invalid.`],
    };
  }

  const activeRotaCount = await doctorScheduleRepository.getActiveRotaCount(
    tenantId,
    result.data.rotaIds
  );

  if (activeRotaCount !== new Set(result.data.rotaIds).size) {
    return {
      success: false,
      errors: ['One or more Doctor rotas are invalid.'],
    };
  }

  return { success: true, data: result.data };
}
