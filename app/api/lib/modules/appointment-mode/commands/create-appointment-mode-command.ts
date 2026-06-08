import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateCreateAppointmentMode } from '../validator/create-appointment-mode-validator';

const CONFLICT_STATUS = 409;

function uniqueConstraintErrors(
  constraint: unknown,
  messages: { name: string; code: string }
): string[] {
  if (constraint === 'appointment_mode_tenant_name_idx') {
    return [messages.name];
  }

  if (constraint === 'appointment_mode_tenant_code_idx') {
    return [messages.code];
  }

  return [];
}

export async function createAppointmentModeCommand(
  payload: unknown
): Promise<CommandResult<AppointmentMode>> {
  const validationResult = validateCreateAppointmentMode(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { tenantId, name, code } = validationResult.data;
  const [existingName, existingCode] = await Promise.all([
    appointmentModeRepository.findActiveByName(tenantId, name),
    appointmentModeRepository.findActiveByCode(tenantId, code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push('An appointment mode with this name already exists');
  }

  if (existingCode) {
    errors.push('An appointment mode with this code already exists');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  try {
    const createdAppointmentMode = await appointmentModeRepository.createAppointmentMode(
      validationResult.data
    );
    return { success: true, data: createdAppointmentMode };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors = uniqueConstraintErrors(err.constraint, {
        name: 'An appointment mode with this name already exists',
        code: 'An appointment mode with this code already exists',
      });

      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
      }
    }
    throw error;
  }
}
