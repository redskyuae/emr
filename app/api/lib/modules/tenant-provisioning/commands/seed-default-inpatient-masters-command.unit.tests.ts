import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultInpatientMastersCommand } from './seed-default-inpatient-masters-command';

describe('SeedDefaultInpatientMasters command', () => {
  const seedAdmissionTypes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedAdmissionTypes.mockResolvedValue(undefined);
  });

  it('should seed the default admission types for the validated tenant', async () => {
    const result = await seedDefaultInpatientMastersCommand(' tenant-a ', seedAdmissionTypes);

    expect(result).toEqual({ success: true, data: undefined });
    expect(seedAdmissionTypes).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([{ code: 'EMER', name: 'Emergency', description: expect.any(String) }])
    );
  });

  it('should seed every default admission type exactly once', async () => {
    await seedDefaultInpatientMastersCommand('tenant-a', seedAdmissionTypes);

    const [, seeds] = seedAdmissionTypes.mock.calls[0];

    expect(seeds.map((seed: { code: string }) => seed.code)).toEqual([
      'EMER',
      'ELEC',
      'TRF',
      'MAT',
      'DAYC',
    ]);
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultInpatientMastersCommand('   ', seedAdmissionTypes);

    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedAdmissionTypes).not.toHaveBeenCalled();
  });

  it('should return a clean failure when seeding rejects', async () => {
    seedAdmissionTypes.mockRejectedValue(new Error('AdmissionType insert failed'));

    const result = await seedDefaultInpatientMastersCommand('tenant-a', seedAdmissionTypes);

    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default inpatient masters.'],
    });
  });
});
