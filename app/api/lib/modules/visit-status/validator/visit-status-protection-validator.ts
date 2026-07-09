import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import type { UpdateVisitStatusInput, VisitStatus } from '../schemas/visit-status-schema';

export function validateSystemVisitStatusUpdate(
  existingStatus: Pick<VisitStatus, 'code' | 'category' | 'isSystem'>,
  payload: Pick<UpdateVisitStatusInput, 'code' | 'category'>
): ValidationResult<void> {
  if (!existingStatus.isSystem) {
    return { success: true, data: undefined };
  }

  const errors: string[] = [];

  if (payload.code !== existingStatus.code) {
    errors.push('System visit status code cannot be changed.');
  }

  if (payload.category !== existingStatus.category) {
    errors.push('System visit status category cannot be changed.');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function validateSystemVisitStatusDelete(
  existingStatus: Pick<VisitStatus, 'isSystem'>
): ValidationResult<void> {
  if (existingStatus.isSystem) {
    return {
      success: false,
      errors: ['System visit status cannot be deleted.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}
