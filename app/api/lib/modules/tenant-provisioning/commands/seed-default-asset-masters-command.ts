import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetConditionRepository } from '../../asset-condition/repository/asset-condition-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

const DEFAULT_ASSET_CATEGORIES = [
  { code: 'IMG', color: '#2563EB', name: 'Diagnostic Imaging' },
  { code: 'MON', color: '#0EA5E9', name: 'Patient Monitoring' },
  { code: 'LIFE', color: '#DC2626', name: 'Life Support' },
  { code: 'SURG', color: '#7C3AED', name: 'Surgical' },
  { code: 'LAB', color: '#D97706', name: 'Laboratory' },
  { code: 'MOB', color: '#16A34A', name: 'Mobility & Furniture' },
  { code: 'IT', color: '#4F46E5', name: 'IT & Network' },
] as const;

const DEFAULT_ASSET_STATUSES = [
  { code: 'INUSE', name: 'In Use', color: '#16A34A' },
  { code: 'AVAIL', name: 'Available', color: '#2563EB' },
  { code: 'MAINT', name: 'Maintenance', color: '#D97706' },
  { code: 'REPAIR', name: 'Repair', color: '#DC2626' },
  { code: 'RETIRED', name: 'Retired', color: '#6B7280' },
] as const;

const DEFAULT_ASSET_CONDITIONS = [
  { code: 'EXC', color: '#16A34A', name: 'Excellent' },
  { code: 'GOOD', color: '#65A30D', name: 'Good' },
  { code: 'FAIR', color: '#D97706', name: 'Fair' },
  { code: 'POOR', color: '#DC2626', name: 'Poor' },
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
