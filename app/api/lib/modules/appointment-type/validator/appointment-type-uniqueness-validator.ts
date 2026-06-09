import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';

const CONFLICT_STATUS = 409;
const APPOINTMENT_TYPE_NAME_EXISTS = 'An appointment type with this name already exists';
const APPOINTMENT_TYPE_CODE_EXISTS = 'An appointment type with this code already exists';

type AppointmentTypeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

export async function validateAppointmentTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(APPOINTMENT_TYPE_NAME_EXISTS);
  }

  if (existingCode) {
    errors.push(APPOINTMENT_TYPE_CODE_EXISTS);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  return { success: true, data: undefined };
}

export function validateAppointmentTypeUniqueConstraint(
  error: unknown
): ValidationResult<never> | null {
  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return null;
  }

  if (err.constraint === 'appointment_type_tenant_name_idx') {
    return {
      success: false,
      errors: [APPOINTMENT_TYPE_NAME_EXISTS],
      status: CONFLICT_STATUS,
    };
  }

  if (err.constraint === 'appointment_type_tenant_code_idx') {
    return {
      success: false,
      errors: [APPOINTMENT_TYPE_CODE_EXISTS],
      status: CONFLICT_STATUS,
    };
  }

  return null;
}
