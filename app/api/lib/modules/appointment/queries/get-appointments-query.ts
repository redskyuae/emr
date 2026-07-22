import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { tenantLocalDateTime } from '../schemas/appointment-slot';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateGetAppointments } from '../validator/get-appointments-validator';

export type GetAppointmentsParams = {
  filters?: unknown;
  tenantId: unknown;
};

export async function getAppointmentsQuery({
  filters,
  tenantId,
}: GetAppointmentsParams): Promise<ListQueryResult<Appointment>> {
  const validationResult = validateGetAppointments(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const params = validationResult.data;

  if (!params.slotDate && !params.patientId) {
    const tenant = await tenantRepository.getTenantById(params.tenantId);

    if (tenant) {
      params.slotDate = tenantLocalDateTime(new Date(), tenant.timeZone).date;
    }
  }

  const { data, total } = await appointmentRepository.getAppointments(params);

  return { success: true, data, total };
}
