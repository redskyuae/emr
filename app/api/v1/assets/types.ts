import type { Asset } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAssetsResponse = Paginated<Asset>;

export type SaveAssetRequest = {
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

export type SaveAssetResponse = {
  data: Asset;
};
