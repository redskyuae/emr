import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import type { AppointmentMode } from '../schemas/appointment-mode-schema';
import { validateAppointmentModeId } from '../validator/appointment-mode-id-validator';
import { validateUpdateAppointmentMode } from '../validator/update-appointment-mode-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

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

export async function updateAppointmentModeCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentMode>> {
  const idValidationResult = validateAppointmentModeId(id);
  const payloadValidationResult = validateUpdateAppointmentMode(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const { tenantId, name, code } = payloadValidationResult.data;
  const existingAppointmentMode = await appointmentModeRepository.getAppointmentModeById(
    idValidationResult.data,
    tenantId
  );

  if (!existingAppointmentMode) {
    return {
      success: false,
      errors: ['Appointment mode not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    appointmentModeRepository.findActiveByName(tenantId, name, {
      excludeId: idValidationResult.data,
    }),
    appointmentModeRepository.findActiveByCode(tenantId, code, {
      excludeId: idValidationResult.data,
    }),
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
    const updatedAppointmentMode = await appointmentModeRepository.updateAppointmentMode(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedAppointmentMode) {
      return {
        success: false,
        errors: ['Appointment mode not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentMode };
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
