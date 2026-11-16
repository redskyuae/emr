import type {
  ChargeItem,
  ChargeItemCategory,
  ChargeItemCodeType,
  VisitChargeKind,
} from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListChargeItemsResponse = Paginated<ChargeItem>;

export type SaveChargeItemRequest = {
  name: string;
  code: string;
  // Defaults to LOCAL. CPT and HCPCS codes must match their code set's format.
  codeType?: ChargeItemCodeType;
  category: ChargeItemCategory;
  unitPrice: number;
  cashPrice?: number | null;
  insuranceContractPrice?: number | null;
  freeFollowUpEligible?: boolean;
  effectiveDate?: string | null;
  visitChargeKind?: VisitChargeKind | null;
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
