import type { AssetStatus } from '@/app/api/lib/modules/asset-status/schemas/asset-status-schema';

export type GetAssetStatusResponse = {
  data: AssetStatus;
};

export type UpdateAssetStatusRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type UpdateAssetStatusResponse = {
  data: AssetStatus;
};

export type DeleteAssetStatusResponse = void;
