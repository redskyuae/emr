import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCheckInVisit } from '../validator/check-in-visit-validator';

export async function checkInVisitCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Visit>> {
  const validationResult = await validateCheckInVisit(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const data = validationResult.data;

  try {
    const result = await visitRepository.checkInVisit(data);

    if (result.success) {
      return result;
    }

    return {
      success: false,
      errors: ['Checked in appointment status is not configured.'],
      status: StatusCodes.CONFLICT,
    };
  } catch (error) {
    const dbError = getDatabaseError(error);

    // The validator already rejects these; the indexes catch the race between
    // two concurrent Check-ins that both passed validation (ADR 0031).
    if (dbError?.code === '23505') {
      if (dbError.constraint === 'visit_active_patient_idx') {
        return {
          success: false,
          errors: [`Patient ${data.patientId} already has an active visit.`],
          status: StatusCodes.CONFLICT,
        };
      }

      if (dbError.constraint === 'visit_active_appointment_idx') {
        return {
          success: false,
          errors: ['Appointment already has a visit.'],
          status: StatusCodes.CONFLICT,
        };
      }

      if (dbError.constraint === 'visit_tenant_visit_number_idx') {
        return {
          success: false,
          errors: ['Visit Number allocation conflicted. Please retry.'],
          status: StatusCodes.CONFLICT,
        };
      }

      if (dbError.constraint === 'visit_doctor_day_token_idx') {
        return {
          success: false,
          errors: ['Queue Token allocation conflicted. Please retry.'],
          status: StatusCodes.CONFLICT,
        };
      }
    }

    throw error;
  }
}
