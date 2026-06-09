import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateCreateAppointmentType } from '../validator/create-appointment-type-validator';

const CONFLICT_STATUS = 409;

function uniqueConstraintErrors(
  constraint: unknown,
  messages: { name: string; code: string }
): string[] {
  if (constraint === 'appointment_type_tenant_name_idx') {
    return [messages.name];
  }

  if (constraint === 'appointment_type_tenant_code_idx') {
    return [messages.code];
  }

  return [];
}

export async function createAppointmentTypeCommand(
  payload: unknown
): Promise<CommandResult<AppointmentType>> {
  const validationResult = validateCreateAppointmentType(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { tenantId, name, code } = validationResult.data;
  const [existingName, existingCode] = await Promise.all([
    appointmentTypeRepository.findActiveByName(tenantId, name),
    appointmentTypeRepository.findActiveByCode(tenantId, code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push('An appointment type with this name already exists');
  }

  if (existingCode) {
    errors.push('An appointment type with this code already exists');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  try {
    const createdAppointmentType = await appointmentTypeRepository.createAppointmentType(
      validationResult.data
    );
    return { success: true, data: createdAppointmentType };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors = uniqueConstraintErrors(err.constraint, {
        name: 'An appointment type with this name already exists',
        code: 'An appointment type with this code already exists',
      });

      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
      }
    }
    throw error;
  }
}
