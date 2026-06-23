import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';

export type GetAssetCategoryResponse = {
  data: AssetCategory;
};

export type UpdateAssetCategoryRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type UpdateAssetCategoryResponse = {
  data: AssetCategory;
};

export type DeleteAssetCategoryResponse = void;
