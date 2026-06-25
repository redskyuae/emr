import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetConditionRepository } from '../../asset-condition/repository/asset-condition-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

const DEFAULT_ASSET_CATEGORIES = [
  { code: 'IMG', name: 'Diagnostic Imaging', color: '#2563EB' },
  { code: 'MON', name: 'Patient Monitoring', color: '#0EA5E9' },
  { code: 'LIFE', name: 'Life Support', color: '#DC2626' },
  { code: 'SURG', name: 'Surgical', color: '#7C3AED' },
  { code: 'LAB', name: 'Laboratory', color: '#D97706' },
  { code: 'MOB', name: 'Mobility & Furniture', color: '#16A34A' },
  { code: 'IT', name: 'IT & Network', color: '#4F46E5' },
] as const;

const DEFAULT_ASSET_STATUSES = [
  { code: 'INUSE', name: 'In Use', color: '#16A34A' },
  { code: 'AVAIL', name: 'Available', color: '#2563EB' },
  { code: 'MAINT', name: 'Maintenance', color: '#D97706' },
  { code: 'REPAIR', name: 'Repair', color: '#DC2626' },
  { code: 'RETIRED', name: 'Retired', color: '#6B7280' },
] as const;

const DEFAULT_ASSET_CONDITIONS = [
  { code: 'EXC', name: 'Excellent', color: '#16A34A' },
  { code: 'GOOD', name: 'Good', color: '#65A30D' },
  { code: 'FAIR', name: 'Fair', color: '#D97706' },
  { code: 'POOR', name: 'Poor', color: '#DC2626' },
] as const;

export async function seedDefaultAssetMastersCommand(
  tenantId: unknown
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await Promise.all([
      assetCategoryRepository.seedDefaultAssetCategories(tenantIdResult.data, [
        ...DEFAULT_ASSET_CATEGORIES.map((assetCategory) => ({
          ...assetCategory,
          description: undefined,
        })),
      ]),
      assetStatusRepository.seedDefaultAssetStatuses(tenantIdResult.data, [
        ...DEFAULT_ASSET_STATUSES.map((assetStatus) => ({
          ...assetStatus,
          description: undefined,
        })),
      ]),
      assetConditionRepository.seedDefaultAssetConditions(tenantIdResult.data, [
        ...DEFAULT_ASSET_CONDITIONS.map((assetCondition) => ({
          ...assetCondition,
          description: undefined,
        })),
      ]),
    ]);
  } catch {
    return { success: false, errors: ['Failed to seed default asset masters.'] };
  }

  return { success: true, data: undefined };
}
