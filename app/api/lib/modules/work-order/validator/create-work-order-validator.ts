import { StatusCodes } from 'http-status-codes';

import { assetRepository } from '../../asset/repository/asset-repository';
import { workOrderPriorityRepository } from '../../work-order-priority/repository/work-order-priority-repository';
import { workOrderStatusRepository } from '../../work-order-status/repository/work-order-status-repository';
import { workOrderTypeRepository } from '../../work-order-type/repository/work-order-type-repository';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { type CreateWorkOrderInput, createWorkOrderSchema } from '../schemas/work-order-schema';

type WorkOrderReferenceReader = {
  getAssetById(id: number, tenantId: string): Promise<unknown>;
  getWorkOrderTypeById(id: number, tenantId: string): Promise<unknown>;
  getWorkOrderStatusById(id: number, tenantId: string): Promise<unknown>;
  getWorkOrderPriorityById(id: number, tenantId: string): Promise<unknown>;
};

const defaultReferenceReader: WorkOrderReferenceReader = {
  getAssetById: assetRepository.getAssetById,
  getWorkOrderTypeById: workOrderTypeRepository.getWorkOrderTypeById,
  getWorkOrderStatusById: workOrderStatusRepository.getWorkOrderStatusById,
  getWorkOrderPriorityById: workOrderPriorityRepository.getWorkOrderPriorityById,
};

export async function validateCreateWorkOrder(
  payload: unknown,
  tenantId: string,
  references: WorkOrderReferenceReader = defaultReferenceReader
): Promise<ValidationResult<CreateWorkOrderInput>> {
  const payloadResult = createWorkOrderSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const input = payloadResult.data;
  const [asset, type, priority, status] = await Promise.all([
    references.getAssetById(input.assetId, tenantId),
    references.getWorkOrderTypeById(input.typeId, tenantId),
    references.getWorkOrderPriorityById(input.priorityId, tenantId),
    references.getWorkOrderStatusById(input.statusId, tenantId),
  ]);
  const errors: string[] = [];

  if (!asset) errors.push(`Asset ${input.assetId} is Invalid.`);
  if (!type) errors.push(`Work order type ${input.typeId} is Invalid.`);
  if (!priority) errors.push(`Work order priority ${input.priorityId} is Invalid.`);
  if (!status) errors.push(`Work order status ${input.statusId} is Invalid.`);

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: input };
}
