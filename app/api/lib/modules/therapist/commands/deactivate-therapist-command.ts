import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';
import type { Therapist } from '../schemas/therapist-schema';
import { validateTherapistExists } from '../validator/therapist-exists-validator';

export async function deactivateTherapistCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<Therapist>> {
  const validation = await validateTherapistExists(id, tenantId);
  if (!validation.success) return validation;
  if (await therapistRepository.hasFutureProcedureAppointment(validation.data.id, tenantId)) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Therapist cannot be deactivated while assigned to a future Procedure Appointment.'],
    };
  }
  const changed = await therapistRepository.setTherapistActive(validation.data.id, tenantId, false);
  const therapist = changed
    ? await therapistRepository.getTherapistById(validation.data.id, tenantId)
    : undefined;
  return therapist
    ? { success: true, data: therapist }
    : { success: false, errors: ['Therapist not found'], status: StatusCodes.NOT_FOUND };
}
