import type { Asset } from '@/app/api/lib/modules/asset/schemas/asset-schema';

export type GetAssetResponse = {
  data: Asset;
};

export type UpdateAssetRequest = {
  name: string;
  categoryId: number;
  statusId: number;
  conditionId?: number;
  manufacturer?: string;
  model?: string;
  serialNumber: string;
  facility?: string;
  department?: string;
  location?: string;
  custodian?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  cost?: number;
  currentValue?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  calibrationDate?: string;
};

export type UpdateAssetResponse = {
  data: Asset;
};

export type DeleteAssetResponse = void;
