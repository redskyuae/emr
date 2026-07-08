import type { ValidationResult } from '@/app/api/lib/utils/types';
import { doctorTenantIdSchema, type DoctorListParams } from '../schemas/doctor-schema';

export function validateGetDoctors(params: DoctorListParams): ValidationResult<DoctorListParams> {
  const tenantResult = doctorTenantIdSchema.safeParse(params.tenantId);

  if (!tenantResult.success) {
    return { success: false, errors: tenantResult.error.issues.map((issue) => issue.message) };
  }

  return { success: true, data: { ...params, tenantId: tenantResult.data } };
}
