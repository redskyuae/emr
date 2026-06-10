import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import type { AppointmentReason } from '../schemas/appointment-reason-schema';
import { validateGetAppointmentReasons } from '../validator/get-appointment-reasons-validator';

export type GetAppointmentReasonsParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAppointmentReasonsQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAppointmentReasonsParams): Promise<ListQueryResult<AppointmentReason>> {
  const tenantIdValidationResult = validateGetAppointmentReasons(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await appointmentReasonRepository.getAppointmentReasons({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
