import type {
  ChargeItemCategory,
  ChargeItemCodeType,
  VisitChargeKind,
} from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';

export type { GetChargeItemResponse, UpdateChargeItemResponse } from '../types';

export type UpdateChargeItemRequest = {
  name: string;
  code: string;
  // Omit to keep the stored code type; CPT and HCPCS codes must match their format.
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

export type DeleteChargeItemResponse = void;
