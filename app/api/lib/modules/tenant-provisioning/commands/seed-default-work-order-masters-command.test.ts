import assert from 'node:assert/strict';

import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;

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

describe('Seed default Work Order masters command', () => {
  test('seeds the exact defaults for the validated Tenant', async () => {
    const calls: Record<string, unknown[]> = {};

    const result = await seedDefaultWorkOrderMastersCommand(' tenant-a ', {
      seedTypes: async (tenantId, defaults) => {
        calls.types = [tenantId, defaults];
      },
      seedStatuses: async (tenantId, defaults) => {
        calls.statuses = [tenantId, defaults];
      },
      seedPriorities: async (tenantId, defaults) => {
        calls.priorities = [tenantId, defaults];
      },
    });

    assert.deepEqual(result, { success: true, data: undefined });
    assert.deepEqual(calls.types, ['tenant-a', expectedTypes]);
    assert.deepEqual(calls.statuses, ['tenant-a', expectedStatuses]);
    assert.deepEqual(calls.priorities, ['tenant-a', expectedPriorities]);
  });

  test('rejects an invalid Tenant before seeding', async () => {
    let repositoryCalled = false;
    const markCalled = async () => {
      repositoryCalled = true;
    };

    const result = await seedDefaultWorkOrderMastersCommand('   ', {
      seedTypes: markCalled,
      seedStatuses: markCalled,
      seedPriorities: markCalled,
    });

    assert.equal(repositoryCalled, false);
    assert.deepEqual(result, { success: false, errors: ['Tenant ID is required'] });
  });

  test('waits for every seeder to settle before reporting failure', async () => {
    let releaseStatuses: (() => void) | undefined;
    let commandFinished = false;
    const statusesFinished = new Promise<void>((resolve) => {
      releaseStatuses = resolve;
    });

    const resultPromise = seedDefaultWorkOrderMastersCommand('tenant-a', {
      seedTypes: async () => undefined,
      seedStatuses: async () => statusesFinished,
      seedPriorities: async () => {
        throw new Error('Priority insert failed');
      },
    });
    void resultPromise.then(() => {
      commandFinished = true;
    });

    await Promise.resolve();
    assert.equal(commandFinished, false);

    releaseStatuses?.();

    const result = await resultPromise;
    assert.deepEqual(result, {
      success: false,
      errors: ['Failed to seed default work order masters.'],
    });
  });
});
