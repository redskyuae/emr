import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorIdSchema, doctorTenantIdSchema } from '../schemas/doctor-schema';

type DoctorIdParams = {
  id: number;
  tenantId: string;
};

export function validateGetDoctorById(
  id: unknown,
  tenantId: string
): ValidationResult<DoctorIdParams> {
  const idResult = doctorIdSchema.safeParse(id);
  const tenantResult = doctorTenantIdSchema.safeParse(tenantId);
  const errors: string[] = [];

  if (!idResult.success) {
    errors.push(`Doctor ${String(id)} is Invalid.`);
  }

  if (!tenantResult.success) {
    errors.push(...tenantResult.error.issues.map((issue) => issue.message));
  }

  if (errors.length > 0 || !idResult.success || !tenantResult.success) {
    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantResult.data } };
}
