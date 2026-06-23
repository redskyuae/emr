import type { AssetCondition } from '@/app/api/lib/modules/asset-condition/schemas/asset-condition-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAssetConditionsResponse = Paginated<AssetCondition>;

export type SaveAssetConditionRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type SaveAssetConditionResponse = {
  data: AssetCondition;
};
