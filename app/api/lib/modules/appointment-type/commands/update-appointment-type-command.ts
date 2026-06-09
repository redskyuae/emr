import type { CommandResult } from '@/app/api/lib/utils/types';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import type { AppointmentType } from '../schemas/appointment-type-schema';
import { validateAppointmentTypeId } from '../validator/appointment-type-id-validator';
import { validateUpdateAppointmentType } from '../validator/update-appointment-type-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

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

export async function updateAppointmentTypeCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<AppointmentType>> {
  const idValidationResult = validateAppointmentTypeId(id);
  const payloadValidationResult = validateUpdateAppointmentType(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const { tenantId, name, code } = payloadValidationResult.data;
  const existingAppointmentType = await appointmentTypeRepository.getAppointmentTypeById(
    idValidationResult.data,
    tenantId
  );

  if (!existingAppointmentType) {
    return {
      success: false,
      errors: ['Appointment type not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    appointmentTypeRepository.findActiveByName(tenantId, name, {
      excludeId: idValidationResult.data,
    }),
    appointmentTypeRepository.findActiveByCode(tenantId, code, {
      excludeId: idValidationResult.data,
    }),
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
    const updatedAppointmentType = await appointmentTypeRepository.updateAppointmentType(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedAppointmentType) {
      return {
        success: false,
        errors: ['Appointment type not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedAppointmentType };
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
