import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateAppointmentTypeTenantId } from '../validator/appointment-type-tenant-id-validator';

export type GetAppointmentTypesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getAppointmentTypesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAppointmentTypesParams): Promise<ListQueryResult<AppointmentType>> {
  const tenantIdValidationResult = validateAppointmentTypeTenantId(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await appointmentTypeRepository.getAppointmentTypes({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
