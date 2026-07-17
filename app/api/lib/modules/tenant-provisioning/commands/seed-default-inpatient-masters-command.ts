import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

type AdmissionTypeSeeder = typeof admissionTypeRepository.seedDefaultAdmissionTypes;

const DEFAULT_ADMISSION_TYPES = [
  {
    code: 'EMER',
    name: 'Emergency',
    description: 'Unplanned admission through emergency attendance',
  },
  { code: 'ELEC', name: 'Elective', description: 'Planned admission scheduled in advance' },
  {
    code: 'TRF',
    name: 'Transfer',
    description: 'Admission transferred in from another facility or OPD',
  },
  { code: 'MAT', name: 'Maternity', description: 'Admission for delivery or obstetric care' },
  { code: 'DAYC', name: 'Day Care', description: 'Same-day admission without an overnight stay' },
] as const;

export async function seedDefaultInpatientMastersCommand(
  tenantId: unknown,
  seedAdmissionTypes: AdmissionTypeSeeder = admissionTypeRepository.seedDefaultAdmissionTypes
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedAdmissionTypes(tenantIdResult.data, [...DEFAULT_ADMISSION_TYPES]);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default inpatient masters.'] };
  }
}
