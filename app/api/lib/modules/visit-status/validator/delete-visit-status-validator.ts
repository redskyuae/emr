import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitStatusRepository } from '../repository/visit-status-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import { visitStatusIdSchema, visitStatusTenantIdSchema } from '../schemas/visit-status-schema';
import { validateSystemVisitStatusDelete } from './visit-status-protection-validator';

export type DeleteVisitStatusInput = { id: number; tenantId: string };

export async function validateDeleteVisitStatus(
  id: unknown,
  tenantId: unknown,
  usage: Pick<typeof visitRepository, 'isStatusInUse'> = visitRepository
): Promise<ValidationResult<DeleteVisitStatusInput>> {
  const idResult = visitStatusIdSchema.safeParse(id);
  const tenantIdResult = visitStatusTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit status ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const existingVisitStatus = await visitStatusRepository.getVisitStatusById(
    idResult.data,
    tenantIdResult.data
  );

  if (!existingVisitStatus) {
    return {
      success: false,
      errors: ['Visit status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const protectionResult = validateSystemVisitStatusDelete(existingVisitStatus);

  if (!protectionResult.success) {
    return protectionResult;
  }

  if (await usage.isStatusInUse(idResult.data, tenantIdResult.data)) {
    return {
      success: false,
      errors: ['Visit status cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
