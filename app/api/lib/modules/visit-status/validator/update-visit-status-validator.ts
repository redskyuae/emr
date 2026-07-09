import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitStatusRepository } from '../repository/visit-status-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import {
  visitStatusIdSchema,
  type UpdateVisitStatusInput,
  updateVisitStatusSchema,
} from '../schemas/visit-status-schema';
import { validateSystemVisitStatusUpdate } from './visit-status-protection-validator';
import { validateVisitStatusUniqueness } from './visit-status-uniqueness-validator';

export type UpdateVisitStatusParams = { id: number; payload: UpdateVisitStatusInput };

export async function validateUpdateVisitStatus(
  id: unknown,
  payload: unknown,
  tenantId: string,
  usage: Pick<typeof visitRepository, 'isStatusInUse'> = visitRepository
): Promise<ValidationResult<UpdateVisitStatusParams>> {
  const idResult = visitStatusIdSchema.safeParse(id);
  const payloadResult = updateVisitStatusSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit status ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingVisitStatus = await visitStatusRepository.getVisitStatusById(
    idResult.data,
    tenantId
  );

  if (!existingVisitStatus) {
    return {
      success: false,
      errors: ['Visit status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const protectionResult = validateSystemVisitStatusUpdate(existingVisitStatus, payloadResult.data);

  if (!protectionResult.success) {
    return protectionResult;
  }

  if (
    existingVisitStatus.category !== payloadResult.data.category &&
    (await usage.isStatusInUse(idResult.data, tenantId))
  ) {
    return {
      success: false,
      errors: ['Visit status category cannot be changed while the status is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const uniquenessResult = await validateVisitStatusUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
