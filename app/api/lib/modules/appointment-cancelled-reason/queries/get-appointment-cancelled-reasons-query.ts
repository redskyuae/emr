import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import type { AppointmentCancelledReason } from '../schemas/appointment-cancelled-reason-schema';
import { validateGetAppointmentCancelledReasons } from '../validator/get-appointment-cancelled-reasons-validator';

export type GetAppointmentCancelledReasonsParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAppointmentCancelledReasonsQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAppointmentCancelledReasonsParams): Promise<ListQueryResult<AppointmentCancelledReason>> {
  const tenantIdValidationResult = validateGetAppointmentCancelledReasons(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await appointmentCancelledReasonRepository.getAppointmentCancelledReasons(
    {
      tenantId: tenantIdValidationResult.data,
      page,
      limit,
      query,
    }
  );

  return { success: true, data, total };
}
