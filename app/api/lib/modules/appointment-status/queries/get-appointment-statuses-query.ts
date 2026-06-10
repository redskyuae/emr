import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import type { AppointmentStatus } from '../schemas/appointment-status-schema';
import { validateGetAppointmentStatuses } from '../validator/get-appointment-statuses-validator';

export type GetAppointmentStatusesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAppointmentStatusesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAppointmentStatusesParams): Promise<ListQueryResult<AppointmentStatus>> {
  const tenantIdValidationResult = validateGetAppointmentStatuses(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await appointmentStatusRepository.getAppointmentStatuses({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
