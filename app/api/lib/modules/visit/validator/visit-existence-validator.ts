import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import { visitIdSchema, visitTenantIdSchema, type Visit } from '../schemas/visit-schema';

export async function validateVisitExists(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<Visit>> {
  const idResult = visitIdSchema.safeParse(id);
  const tenantIdResult = visitTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  const existingVisit = await visitRepository.getVisitById(idResult.data, tenantIdResult.data);

  if (!existingVisit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: existingVisit };
}
