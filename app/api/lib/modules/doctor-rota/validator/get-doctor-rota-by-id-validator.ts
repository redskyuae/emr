import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorRotaIdSchema, doctorRotaTenantIdSchema } from '../schemas/doctor-rota-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export type GetDoctorRotaByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetDoctorRotaById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetDoctorRotaByIdInput> {
  const idResult = doctorRotaIdSchema.safeParse(id);
  const tenantIdResult = doctorRotaTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Doctor rota ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
