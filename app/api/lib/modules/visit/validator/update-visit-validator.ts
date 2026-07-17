import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitRepository } from '../repository/visit-repository';
import { updateVisitSchema, visitIdSchema, type UpdateVisitInput } from '../schemas/visit-schema';

export type UpdateVisitParams = {
  id: number;
  payload: UpdateVisitInput;
};

export async function validateUpdateVisit(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateVisitParams>> {
  const idResult = visitIdSchema.safeParse(id);
  const payloadResult = updateVisitSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingVisit = await visitRepository.getVisitById(idResult.data, tenantId);

  if (!existingVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  // A closed Visit is a historical record; only an Active Visit is still being
  // written up (ADR 0027).
  if (existingVisit.status === 'COMPLETED' || existingVisit.status === 'CANCELLED') {
    return {
      success: false,
      errors: [`Visit ${existingVisit.visitNumber} is closed and cannot be edited.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: { id: idResult.data, payload: payloadResult.data },
  };
}
