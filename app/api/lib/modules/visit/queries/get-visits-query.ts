import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateGetVisits } from '../validator/get-visits-validator';

export type GetVisitsParams = {
  filters?: unknown;
  tenantId: unknown;
};

export async function getVisitsQuery({
  filters,
  tenantId,
}: GetVisitsParams): Promise<ListQueryResult<Visit>> {
  const validationResult = validateGetVisits(filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const params = validationResult.data;

  // The board opens on today's queue. "Today" is the Tenant's operational day
  // (ADR 0026), and only an unfiltered request gets that default — a caller
  // asking for one Patient's history wants every Visit, not just today's.
  if (!params.visitDate && !params.patientId) {
    const tenant = await tenantRepository.getTenantById(params.tenantId);

    if (tenant) {
      params.visitDate = tenantLocalDateTime(new Date(), tenant.timeZone).date;
    }
  }

  const { data, total } = await visitRepository.getVisits(params);

  return { success: true, data, total };
}
