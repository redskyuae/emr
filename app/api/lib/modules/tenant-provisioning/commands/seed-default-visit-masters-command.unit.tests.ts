import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultVisitMastersCommand } from './seed-default-visit-masters-command';

describe('SeedDefaultVisitMasters command', () => {
  const seedVisitTypes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedVisitTypes.mockResolvedValue(undefined);
  });

  it('should seed the default visit types for the validated tenant', async () => {
    const result = await seedDefaultVisitMastersCommand(' tenant-a ', seedVisitTypes);

    expect(result).toEqual({ success: true, data: undefined });
    expect(seedVisitTypes).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([
        { code: 'OPD', name: 'OPD Consultation', description: expect.any(String) },
      ])
    );
  });

  it('should seed every default visit type exactly once', async () => {
    await seedDefaultVisitMastersCommand('tenant-a', seedVisitTypes);

    const [, seeds] = seedVisitTypes.mock.calls[0];

    expect(seeds.map((seed: { code: string }) => seed.code)).toEqual([
      'OPD',
      'FUP',
      'PROC',
      'VAC',
      'EMER',
    ]);
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultVisitMastersCommand('   ', seedVisitTypes);

    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedVisitTypes).not.toHaveBeenCalled();
  });

  it('should return a clean failure when seeding rejects', async () => {
    seedVisitTypes.mockRejectedValue(new Error('VisitType insert failed'));

    const result = await seedDefaultVisitMastersCommand('tenant-a', seedVisitTypes);

    expect(result).toEqual({ success: false, errors: ['Failed to seed default visit masters.'] });
  });
});
