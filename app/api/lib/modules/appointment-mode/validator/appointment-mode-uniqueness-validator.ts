import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
const APPOINTMENT_MODE_NAME_EXISTS = "Appointment mode name '{value}' already exists.";
const APPOINTMENT_MODE_CODE_EXISTS = "Appointment mode code '{value}' already exists.";

type AppointmentModeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

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
    errors.push(duplicateError(APPOINTMENT_MODE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_MODE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAppointmentModeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentModeUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'appointment_mode_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_MODE_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'appointment_mode_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_MODE_CODE_EXISTS, input.code)];
  }

  return [];
}
