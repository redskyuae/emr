import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultSpecialtiesCommand } from './seed-default-specialties-command';

const expectedSpecialties = [
  { code: 'GEN', name: 'General Medicine', description: undefined },
  { code: 'CARD', name: 'Cardiology', description: undefined },
  { code: 'PED', name: 'Pediatrics', description: undefined },
  { code: 'ORTH', name: 'Orthopedics', description: undefined },
  { code: 'DERM', name: 'Dermatology', description: undefined },
  { code: 'ENT', name: 'ENT', description: undefined },
  { code: 'GYN', name: 'Gynaecology', description: undefined },
  { code: 'NEUR', name: 'Neurology', description: undefined },
  { code: 'PSY', name: 'Psychiatry', description: undefined },
  { code: 'GS', name: 'General Surgery', description: undefined },
];

describe('SeedDefaultSpecialties command', () => {
  const seedSpecialties = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedSpecialties.mockResolvedValue(undefined);
  });

  it('should seed the exact defaults for the validated tenant', async () => {
    const result = await seedDefaultSpecialtiesCommand(' tenant-a ', seedSpecialties);

    expect(result).toEqual({ success: true, data: undefined });
    expect(seedSpecialties).toHaveBeenCalledWith('tenant-a', expectedSpecialties);
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultSpecialtiesCommand('   ', seedSpecialties);

    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedSpecialties).not.toHaveBeenCalled();
  });

  it('should return a clean failure when seeding rejects', async () => {
    seedSpecialties.mockRejectedValue(new Error('Specialty insert failed'));

    const result = await seedDefaultSpecialtiesCommand('tenant-a', seedSpecialties);

    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default specialties.'],
    });
  });
});
