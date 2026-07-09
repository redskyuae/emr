import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';
import { visitStatusRepository } from '../../visit-status/repository/visit-status-repository';

const DEFAULT_VISIT_STATUSES = [
  { code: 'WAIT', name: 'Waiting', color: '#6B7280', category: 'WAITING', isSystem: true },
  {
    code: 'INPROG',
    name: 'In Progress',
    color: '#2563EB',
    category: 'IN_PROGRESS',
    isSystem: true,
  },
  { code: 'DONE', name: 'Completed', color: '#16A34A', category: 'COMPLETED', isSystem: true },
  { code: 'CANC', name: 'Cancelled', color: '#DC2626', category: 'CANCELLED', isSystem: true },
] as const;

type VisitMasterSeeders = {
  seedStatuses: typeof visitStatusRepository.seedDefaultVisitStatuses;
};

const visitMasterSeeders: VisitMasterSeeders = {
  seedStatuses: visitStatusRepository.seedDefaultVisitStatuses,
};

export async function seedDefaultVisitMastersCommand(
  tenantId: unknown,
  seeders: VisitMasterSeeders = visitMasterSeeders
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seeders.seedStatuses(tenantIdResult.data, [
      ...DEFAULT_VISIT_STATUSES.map((visitStatus) => ({
        ...visitStatus,
        description: undefined,
      })),
    ]);
  } catch {
    return { success: false, errors: ['Failed to seed default visit masters.'] };
  }

  return { success: true, data: undefined };
}
