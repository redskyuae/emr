import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { chargeItemRepository } from '../repository/charge-item-repository';
import type { ChargeItem } from '../schemas/charge-item-schema';
import { validateGetChargeItems } from '../validator/get-charge-items-validator';

export type GetChargeItemsParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
  category?: unknown;
  isActive?: boolean;
};

export async function getChargeItemsQuery({
  tenantId,
  page,
  limit,
  query,
  category,
  isActive,
}: GetChargeItemsParams): Promise<ListQueryResult<ChargeItem>> {
  const validationResult = validateGetChargeItems(tenantId, category);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await chargeItemRepository.getChargeItems({
    tenantId: validationResult.data.tenantId,
    category: validationResult.data.category,
    page,
    limit,
    query,
    isActive,
  });

  return { success: true, data, total };
}
