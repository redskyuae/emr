import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { DEFAULT_TREATMENTS } from '../../treatment/seed-data';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';

type VisitTypeSeeder = typeof visitTypeRepository.seedDefaultVisitTypes;
type TreatmentSeeder = typeof treatmentRepository.seedDefaultTreatments;

const DEFAULT_VISIT_TYPES = [
  { code: 'OPD', name: 'OPD Consultation', description: 'Standard outpatient consultation' },
  { code: 'FUP', name: 'Follow-up', description: 'Follow-up on an earlier Visit' },
  { code: 'PROC', name: 'Procedure', description: 'Day procedure without Admission' },
  { code: 'VAC', name: 'Vaccination', description: 'Vaccination or immunisation Visit' },
  { code: 'EMER', name: 'Emergency', description: 'Walk-in emergency attendance' },
] as const;

export async function seedDefaultVisitMastersCommand(
  tenantId: unknown,
  seedVisitTypes: VisitTypeSeeder = visitTypeRepository.seedDefaultVisitTypes,
  seedTreatments: TreatmentSeeder = treatmentRepository.seedDefaultTreatments
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedVisitTypes(tenantIdResult.data, [...DEFAULT_VISIT_TYPES]);
    await seedTreatments(tenantIdResult.data, DEFAULT_TREATMENTS);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default visit masters.'] };
  }
}
