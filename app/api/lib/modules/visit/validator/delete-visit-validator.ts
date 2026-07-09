import type { ValidationResult } from '@/app/api/lib/utils/types';
import { validateVisitExists } from './visit-existence-validator';

export type DeleteVisitInput = { id: number; tenantId: string };

export async function validateDeleteVisit(
  id: unknown,
  tenantId: string
): Promise<ValidationResult<DeleteVisitInput>> {
  const existsResult = await validateVisitExists(id, tenantId);

  if (!existsResult.success) {
    return { success: false, errors: existsResult.errors, status: existsResult.status };
  }

  return { success: true, data: { id: existsResult.data.id, tenantId } };
}
