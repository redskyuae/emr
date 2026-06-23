import type { AssetStatus } from '@/app/api/lib/modules/asset-status/schemas/asset-status-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAssetStatusesResponse = Paginated<AssetStatus>;

export type SaveAssetStatusRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type SaveAssetStatusResponse = {
  data: AssetStatus;
};
