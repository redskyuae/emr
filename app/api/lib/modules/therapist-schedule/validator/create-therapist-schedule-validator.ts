import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { therapistRepository } from '../../therapist/repository/therapist-repository';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import {
  createTherapistScheduleSchema,
  type CreateTherapistScheduleInput,
} from '../schemas/therapist-schedule-schema';

export async function validateCreateTherapistSchedule(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateTherapistScheduleInput>> {
  const result = createTherapistScheduleSchema.safeParse(payload);
  if (!result.success) return { success: false, errors: formatValidationErrors(result.error) };

  const therapist = await therapistRepository.getTherapistById(result.data.therapistId, tenantId);
  if (!therapist || !therapist.isActive) {
    return { success: false, errors: [`Therapist ${result.data.therapistId} is Invalid.`] };
  }

  const activeRotaCount = await therapistScheduleRepository.getActiveRotaCount(
    tenantId,
    result.data.rotaIds
  );
  if (activeRotaCount !== new Set(result.data.rotaIds).size) {
    return { success: false, errors: ['One or more rotas are invalid.'] };
  }
  return { success: true, data: result.data };
}
