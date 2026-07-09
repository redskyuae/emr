import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { updateVisitSchema, type UpdateVisitInput } from '../schemas/visit-schema';
import { validateVisitExists } from './visit-existence-validator';
import { validateVisitReferences } from './visit-reference-validator';

export type UpdateVisitParams = { id: number; payload: UpdateVisitInput; expectedStatusId: number };

export async function validateUpdateVisit(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateVisitParams>> {
  const payloadResult = updateVisitSchema.safeParse(payload);
  const existsResult = await validateVisitExists(id, tenantId);

  if (!existsResult.success) {
    const errors = payloadResult.success
      ? existsResult.errors
      : [...existsResult.errors, ...formatValidationErrors(payloadResult.error)];

    return { success: false, errors, status: existsResult.status };
  }

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  if (
    existsResult.data.status.category === 'COMPLETED' ||
    existsResult.data.status.category === 'CANCELLED'
  ) {
    return {
      success: false,
      errors: ['Visit can no longer be edited once it is Completed or Cancelled.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const referenceResult = await validateVisitReferences(tenantId, payloadResult.data);

  if (!referenceResult.success) {
    return { success: false, errors: referenceResult.errors, status: referenceResult.status };
  }

  return {
    success: true,
    data: {
      id: existsResult.data.id,
      payload: payloadResult.data,
      expectedStatusId: existsResult.data.statusId,
    },
  };
}
