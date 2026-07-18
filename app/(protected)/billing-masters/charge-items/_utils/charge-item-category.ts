import { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';
import type { ChargeItemCategory } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';

const CHARGE_ITEM_CATEGORY_LABELS: Record<ChargeItemCategory, string> = {
  CONSULTATION: 'Consultation',
  PROCEDURE: 'Procedure',
  INVESTIGATION: 'Investigation',
  BED: 'Bed',
  CONSUMABLE: 'Consumable',
  OTHER: 'Other',
};

export const CHARGE_ITEM_CATEGORY_OPTIONS = CHARGE_ITEM_CATEGORIES.map((value) => ({
  value,
  label: CHARGE_ITEM_CATEGORY_LABELS[value],
}));

export function getChargeItemCategoryLabel(category: ChargeItemCategory) {
  return CHARGE_ITEM_CATEGORY_LABELS[category];
}

export function formatUnitPrice(unitPrice: number) {
  return unitPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
