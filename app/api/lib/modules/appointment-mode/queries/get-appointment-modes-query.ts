import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateAppointmentModeTenantId } from '../validator/appointment-mode-tenant-id-validator';

export type GetAppointmentModesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAppointmentModesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAppointmentModesParams): Promise<ListQueryResult<AppointmentMode>> {
  const tenantIdValidationResult = validateAppointmentModeTenantId(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await appointmentModeRepository.getAppointmentModes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
