import type { AssetCondition } from '@/app/api/lib/modules/asset-condition/schemas/asset-condition-schema';

export type GetAssetConditionResponse = {
  data: AssetCondition;
};

export type UpdateAssetConditionRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type UpdateAssetConditionResponse = {
  data: AssetCondition;
};

export type DeleteAssetConditionResponse = void;
