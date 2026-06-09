import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';

const CONFLICT_STATUS = 409;
const APPOINTMENT_MODE_NAME_EXISTS = 'An appointment mode with this name already exists';
const APPOINTMENT_MODE_CODE_EXISTS = 'An appointment mode with this code already exists';

type AppointmentModeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

export async function validateAppointmentModeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentModeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentModeRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentModeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(APPOINTMENT_MODE_NAME_EXISTS);
  }

  if (existingCode) {
    errors.push(APPOINTMENT_MODE_CODE_EXISTS);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  return { success: true, data: undefined };
}

export function validateAppointmentModeUniqueConstraint(
  error: unknown
): ValidationResult<never> | null {
  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return null;
  }

  if (err.constraint === 'appointment_mode_tenant_name_idx') {
    return {
      success: false,
      errors: [APPOINTMENT_MODE_NAME_EXISTS],
      status: CONFLICT_STATUS,
    };
  }

  if (err.constraint === 'appointment_mode_tenant_code_idx') {
    return {
      success: false,
      errors: [APPOINTMENT_MODE_CODE_EXISTS],
      status: CONFLICT_STATUS,
    };
  }

  return null;
}
