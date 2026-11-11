import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admitSourceRepository } from '../../admit-source/repository/admit-source-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { DEFAULT_TREATMENTS } from '../../treatment/seed-data';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';

type VisitTypeSeeder = typeof visitTypeRepository.seedDefaultVisitTypes;
type TreatmentSeeder = typeof treatmentRepository.seedDefaultTreatments;
type AdmitSourceSeeder = typeof admitSourceRepository.seedDefaultAdmitSources;

const DEFAULT_VISIT_TYPES = [
  { code: 'OPD', name: 'OPD Consultation', description: 'Standard outpatient consultation' },
  { code: 'FUP', name: 'Follow-up', description: 'Follow-up on an earlier Visit' },
  { code: 'PROC', name: 'Procedure', description: 'Day procedure without Admission' },
  { code: 'VAC', name: 'Vaccination', description: 'Vaccination or immunisation Visit' },
  { code: 'EMER', name: 'Emergency', description: 'Walk-in emergency attendance' },
] as const;

const DEFAULT_ADMIT_SOURCES = [
  { code: 'SELF', name: 'Self / Walk-in', description: 'Patient came without a referral' },
  { code: 'DOCREF', name: 'Doctor Referral', description: 'Referred by an external Doctor' },
  { code: 'HOSPTRF', name: 'Hospital Transfer', description: 'Transferred from another hospital' },
  { code: 'CLINREF', name: 'Clinic Referral', description: 'Referred by another clinic' },
  { code: 'EMER', name: 'Emergency', description: 'Arrived as an emergency' },
  { code: 'CAMP', name: 'Camp / Outreach', description: 'Came through a camp or outreach event' },
  { code: 'OTHER', name: 'Other', description: 'Any other source' },
] as const;

export async function seedDefaultVisitMastersCommand(
  tenantId: unknown,
  seedVisitTypes: VisitTypeSeeder = visitTypeRepository.seedDefaultVisitTypes,
  seedTreatments: TreatmentSeeder = treatmentRepository.seedDefaultTreatments,
  seedAdmitSources: AdmitSourceSeeder = admitSourceRepository.seedDefaultAdmitSources
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedVisitTypes(tenantIdResult.data, [...DEFAULT_VISIT_TYPES]);
    await seedTreatments(tenantIdResult.data, DEFAULT_TREATMENTS);
    await seedAdmitSources(tenantIdResult.data, [...DEFAULT_ADMIT_SOURCES]);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default visit masters.'] };
  }
}
