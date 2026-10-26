import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { chargeItemRepository } from '../../charge-item/repository/charge-item-repository';
import { DEFAULT_VISIT_CHARGE_ITEMS } from '../../charge-item/seed-data';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

type ChargeItemSeeder = typeof chargeItemRepository.seedDefaultVisitChargeItems;

export async function seedDefaultBillingMastersCommand(
  tenantId: unknown,
  seedChargeItems: ChargeItemSeeder = chargeItemRepository.seedDefaultVisitChargeItems
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);
  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedChargeItems(tenantIdResult.data, DEFAULT_VISIT_CHARGE_ITEMS);
    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default billing masters.'] };
  }
}
