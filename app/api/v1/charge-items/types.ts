import type {
  ChargeItem,
  ChargeItemCategory,
} from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListChargeItemsResponse = Paginated<ChargeItem>;

export type SaveChargeItemRequest = {
  name: string;
  code: string;
  category: ChargeItemCategory;
  unitPrice: number;
  description?: string | null;
  isActive?: boolean;
};

export type SaveChargeItemResponse = {
  data: ChargeItem;
};

export type GetChargeItemResponse = {
  data: ChargeItem;
};

export type UpdateChargeItemResponse = {
  data: ChargeItem;
};
