import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import type {
  UpdateWorkOrderStatusInput,
  WorkOrderStatus,
} from '../schemas/work-order-status-schema';

export function validateSystemWorkOrderStatusUpdate(
  existingStatus: Pick<WorkOrderStatus, 'code' | 'category' | 'isSystem'>,
  payload: Pick<UpdateWorkOrderStatusInput, 'code' | 'category'>
): ValidationResult<void> {
  if (!existingStatus.isSystem) {
    return { success: true, data: undefined };
  }

  const errors: string[] = [];

  if (payload.code !== existingStatus.code) {
    errors.push('System work order status code cannot be changed.');
  }

  if (payload.category !== existingStatus.category) {
    errors.push('System work order status category cannot be changed.');
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function validateSystemWorkOrderStatusDelete(
  existingStatus: Pick<WorkOrderStatus, 'isSystem'>
): ValidationResult<void> {
  if (existingStatus.isSystem) {
    return {
      success: false,
      errors: ['System work order status cannot be deleted.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}
