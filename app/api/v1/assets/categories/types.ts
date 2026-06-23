import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAssetCategoriesResponse = Paginated<AssetCategory>;

export type SaveAssetCategoryRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type SaveAssetCategoryResponse = {
  data: AssetCategory;
};
