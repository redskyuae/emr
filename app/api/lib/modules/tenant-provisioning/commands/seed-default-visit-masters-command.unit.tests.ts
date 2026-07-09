import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultVisitMastersCommand } from './seed-default-visit-masters-command';

const expectedStatuses = [
  {
    code: 'WAIT',
    name: 'Waiting',
    color: '#6B7280',
    category: 'WAITING',
    isSystem: true,
    description: undefined,
  },
  {
    code: 'INPROG',
    name: 'In Progress',
    color: '#2563EB',
    category: 'IN_PROGRESS',
    isSystem: true,
    description: undefined,
  },
  {
    code: 'DONE',
    name: 'Completed',
    color: '#16A34A',
    category: 'COMPLETED',
    isSystem: true,
    description: undefined,
  },
  {
    code: 'CANC',
    name: 'Cancelled',
    color: '#DC2626',
    category: 'CANCELLED',
    isSystem: true,
    description: undefined,
  },
];

describe('SeedDefaultVisitMasters command', () => {
  const seedStatuses = vi.fn();
  const seeders = { seedStatuses };

  beforeEach(() => {
    vi.clearAllMocks();
    seedStatuses.mockResolvedValue(undefined);
  });

  it('should seed the exact defaults for the validated (trimmed) tenant', async () => {
    const result = await seedDefaultVisitMastersCommand(' tenant-a ', seeders);
    expect(result).toEqual({ success: true, data: undefined });
    expect(seedStatuses).toHaveBeenCalledWith('tenant-a', expectedStatuses);
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultVisitMastersCommand('   ', seeders);
    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedStatuses).not.toHaveBeenCalled();
  });

  it('should report failure when the seeder rejects', async () => {
    seedStatuses.mockRejectedValue(new Error('Status insert failed'));
    const result = await seedDefaultVisitMastersCommand('tenant-a', seeders);
    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default visit masters.'],
    });
    expect(seedStatuses).toHaveBeenCalledTimes(1);
  });
});
