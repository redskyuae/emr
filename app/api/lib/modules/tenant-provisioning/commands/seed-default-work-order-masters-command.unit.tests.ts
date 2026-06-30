import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';

const expectedTypes = [
  { code: 'PREV', name: 'Preventive', color: '#2563EB', description: undefined },
  { code: 'CORR', name: 'Corrective', color: '#DC2626', description: undefined },
  { code: 'CALIB', name: 'Calibration', color: '#7C3AED', description: undefined },
  { code: 'INSP', name: 'Inspection', color: '#0EA5E9', description: undefined },
];

const expectedPriorities = [
  { code: 'LOW', name: 'Low', color: '#6B7280', description: undefined },
  { code: 'MED', name: 'Medium', color: '#2563EB', description: undefined },
  { code: 'HIGH', name: 'High', color: '#D97706', description: undefined },
  { code: 'CRIT', name: 'Critical', color: '#DC2626', description: undefined },
];

const expectedStatuses = [
  {
    code: 'OPEN',
    name: 'Open',
    color: '#6B7280',
    category: 'OPEN',
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
    code: 'SCHED',
    name: 'Scheduled',
    color: '#D97706',
    category: 'SCHEDULED',
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
    code: 'OVERDUE',
    name: 'Overdue',
    color: '#DC2626',
    category: 'OVERDUE',
    isSystem: true,
    description: undefined,
  },
];

describe('SeedDefaultWorkOrderMasters command', () => {
  const seedTypes = vi.fn();
  const seedStatuses = vi.fn();
  const seedPriorities = vi.fn();
  const seeders = { seedTypes, seedStatuses, seedPriorities };

  beforeEach(() => {
    vi.clearAllMocks();
    seedTypes.mockResolvedValue(undefined);
    seedStatuses.mockResolvedValue(undefined);
    seedPriorities.mockResolvedValue(undefined);
  });

  it('should seed the exact defaults for the validated (trimmed) tenant', async () => {
    const result = await seedDefaultWorkOrderMastersCommand(' tenant-a ', seeders);
    expect(result).toEqual({ success: true, data: undefined });
    expect(seedTypes).toHaveBeenCalledWith('tenant-a', expectedTypes);
    expect(seedPriorities).toHaveBeenCalledWith('tenant-a', expectedPriorities);
    expect(seedStatuses).toHaveBeenCalledWith('tenant-a', expectedStatuses);
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultWorkOrderMastersCommand('   ', seeders);
    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedTypes).not.toHaveBeenCalled();
    expect(seedStatuses).not.toHaveBeenCalled();
    expect(seedPriorities).not.toHaveBeenCalled();
  });

  it('should report failure but still run every seeder when one rejects', async () => {
    seedPriorities.mockRejectedValue(new Error('Priority insert failed'));
    const result = await seedDefaultWorkOrderMastersCommand('tenant-a', seeders);
    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default work order masters.'],
    });
    expect(seedTypes).toHaveBeenCalledTimes(1);
    expect(seedStatuses).toHaveBeenCalledTimes(1);
    expect(seedPriorities).toHaveBeenCalledTimes(1);
  });
});
