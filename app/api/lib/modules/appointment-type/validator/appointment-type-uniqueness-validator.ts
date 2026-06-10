import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';

const CONFLICT_STATUS = 409;
const APPOINTMENT_TYPE_NAME_EXISTS = "Appointment type name '{value}' already exists.";
const APPOINTMENT_TYPE_CODE_EXISTS = "Appointment type code '{value}' already exists.";

type AppointmentTypeUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

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
    errors.push(duplicateError(APPOINTMENT_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  return { success: true, data: undefined };
}

export function getAppointmentTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentTypeUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'appointment_type_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_TYPE_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'appointment_type_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
