import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyRepository } from '../../specialty/repository/specialty-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

const DEFAULT_SPECIALTIES = [
  { code: 'GEN', name: 'General Medicine' },
  { code: 'CARD', name: 'Cardiology' },
  { code: 'PED', name: 'Pediatrics' },
  { code: 'ORTH', name: 'Orthopedics' },
  { code: 'DERM', name: 'Dermatology' },
  { code: 'ENT', name: 'ENT' },
  { code: 'GYN', name: 'Gynaecology' },
  { code: 'NEUR', name: 'Neurology' },
  { code: 'PSY', name: 'Psychiatry' },
  { code: 'GS', name: 'General Surgery' },
] as const;

type SpecialtySeeder = typeof specialtyRepository.seedDefaultSpecialties;

export async function seedDefaultSpecialtiesCommand(
  tenantId: unknown,
  seedSpecialties: SpecialtySeeder = specialtyRepository.seedDefaultSpecialties
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedSpecialties(
      tenantIdResult.data,
      DEFAULT_SPECIALTIES.map((specialty) => ({ ...specialty, description: undefined }))
    );

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default specialties.'] };
  }
}
