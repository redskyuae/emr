import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';

type VisitTypeSeeder = typeof visitTypeRepository.seedDefaultVisitTypes;

const DEFAULT_VISIT_TYPES = [
  { code: 'OPD', name: 'OPD Consultation', description: 'Standard outpatient consultation' },
  { code: 'FUP', name: 'Follow-up', description: 'Follow-up on an earlier Visit' },
  { code: 'PROC', name: 'Procedure', description: 'Day procedure without Admission' },
  { code: 'VAC', name: 'Vaccination', description: 'Vaccination or immunisation Visit' },
  { code: 'EMER', name: 'Emergency', description: 'Walk-in emergency attendance' },
] as const;

export async function seedDefaultVisitMastersCommand(
  tenantId: unknown,
  seedVisitTypes: VisitTypeSeeder = visitTypeRepository.seedDefaultVisitTypes
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedVisitTypes(tenantIdResult.data, [...DEFAULT_VISIT_TYPES]);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default visit masters.'] };
  }
}
