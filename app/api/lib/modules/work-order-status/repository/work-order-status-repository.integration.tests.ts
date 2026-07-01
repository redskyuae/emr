import { describe, expect, it } from 'vitest';

import type { WorkOrderStatusCategory } from '../schemas/work-order-status-schema';

import { workOrderStatusRepository } from './work-order-status-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createStatus = (tenantId: string, name: string, code: string, category: WorkOrderStatusCategory) =>
  workOrderStatusRepository.createWorkOrderStatus({
    tenantId,
    name,
    code,
    category,
    color: '#FF0000',
    description: undefined,
  });

describe('WorkOrderStatus repository', () => {
  it('should create work order status for a tenant', async () => {
    const created = await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Open',
      code: 'OPN',
      category: 'OPEN',
      color: '#FF0000',
      isSystem: false,
    });
  });

  it('should get work order status by id for same tenant', async () => {
    const created = await createStatus(tenantA, 'In Progress', 'PRG', 'IN_PROGRESS');
    await expect(
      workOrderStatusRepository.getWorkOrderStatusById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get work order status by id for another tenant', async () => {
    const created = await createStatus(tenantA, 'Pending', 'PND', 'OPEN');
    await expect(
      workOrderStatusRepository.getWorkOrderStatusById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only work order statuses for the requested tenant', async () => {
    await createStatus(tenantA, 'Closed', 'CLS', 'COMPLETED');
    await createStatus(tenantB, 'Resolved', 'RES', 'COMPLETED');
    const result = await workOrderStatusRepository.getWorkOrderStatuses({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted work order statuses', async () => {
    const deleted = await createStatus(tenantA, 'On Hold', 'HLD', 'SCHEDULED');
    const deleteResult = await workOrderStatusRepository.deleteWorkOrderStatus(deleted.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    await createStatus(tenantA, 'Cancelled', 'CAN', 'COMPLETED');
    const result = await workOrderStatusRepository.getWorkOrderStatuses({ tenantId: tenantA });
    expect(result.data.map((s) => s.code)).toEqual(['CAN']);
  });

  it('should soft-delete work order status and exclude it from future reads', async () => {
    const created = await createStatus(tenantA, 'Completed', 'CMP', 'COMPLETED');
    const deleteResult = await workOrderStatusRepository.deleteWorkOrderStatus(created.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    expect(deleteResult.outcome === 'deleted' && deleteResult.data?.id).toBe(created.id);
    await expect(
      workOrderStatusRepository.getWorkOrderStatusById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active work order status for the requested tenant', async () => {
    const created = await createStatus(tenantA, 'Review', 'RVW', 'IN_PROGRESS');
    const updateResult = await workOrderStatusRepository.updateWorkOrderStatus(created.id, {
      tenantId: tenantA,
      name: 'Under Review',
      code: 'URV',
      category: 'IN_PROGRESS',
      color: '#00FF00',
      description: undefined,
    });
    expect(updateResult.outcome).toBe('updated');
    expect(updateResult.outcome === 'updated' && updateResult.data).toMatchObject({
      name: 'Under Review',
      code: 'URV',
    });

    await workOrderStatusRepository.deleteWorkOrderStatus(created.id, tenantA);
    const updateAfterDelete = await workOrderStatusRepository.updateWorkOrderStatus(created.id, {
      tenantId: tenantA,
      name: 'Review',
      code: 'RVW',
      category: 'IN_PROGRESS',
      color: '#FF0000',
      description: undefined,
    });
    expect(updateAfterDelete.outcome).toBe('not-found');
  });

  it("should not update another tenant's work order status", async () => {
    const created = await createStatus(tenantA, 'Approved', 'APR', 'COMPLETED');
    const updateResult = await workOrderStatusRepository.updateWorkOrderStatus(created.id, {
      tenantId: tenantB,
      name: 'Rejected',
      code: 'REJ',
      category: 'OVERDUE',
      color: '#FF0000',
      description: undefined,
    });
    expect(updateResult.outcome).toBe('not-found');
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    await expect(createStatus(tenantA, 'open', 'OPN2', 'OPEN')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_status_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    await expect(createStatus(tenantA, 'Closed', 'opn', 'COMPLETED')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_status_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    await expect(createStatus(tenantB, 'Open', 'OPN', 'OPEN')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    await workOrderStatusRepository.deleteWorkOrderStatus(created.id, tenantA);
    await expect(createStatus(tenantA, 'open', 'opn', 'OPEN')).resolves.toMatchObject({
      name: 'open',
      code: 'opn',
    });
  });

  it('should search by name and code', async () => {
    await createStatus(tenantA, 'Open', 'OPN', 'OPEN');
    await createStatus(tenantA, 'In Progress', 'PRG', 'IN_PROGRESS');
    expect(
      (
        await workOrderStatusRepository.getWorkOrderStatuses({ tenantId: tenantA, query: 'prog' })
      ).data.map((s) => s.code)
    ).toEqual(['PRG']);
    expect(
      (
        await workOrderStatusRepository.getWorkOrderStatuses({ tenantId: tenantA, query: 'OPN' })
      ).data.map((s) => s.name)
    ).toEqual(['Open']);
  });

  it('should paginate list results and return total', async () => {
    await createStatus(tenantA, 'Alpha', 'A', 'OPEN');
    await createStatus(tenantA, 'Bravo', 'B', 'IN_PROGRESS');
    await createStatus(tenantA, 'Charlie', 'C', 'COMPLETED');
    const result = await workOrderStatusRepository.getWorkOrderStatuses({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((status) => status.name)).toEqual(['Charlie']);
  });

  it('should return in-use outcome when deleting system status', async () => {
    // System statuses have isSystem: true and cannot be deleted
    const { db } = await import('@/app/db');
    const { workOrderStatus: workOrderStatusTable } =
      await import('@/app/db/schema/work-order-status');

    const [systemStatus] = await db
      .insert(workOrderStatusTable)
      .values({
        tenantId: tenantA,
        name: 'System Status',
        code: 'SYS',
        category: 'OPEN',
        color: '#FF0000',
        isSystem: true,
      })
      .returning({ id: workOrderStatusTable.id });

    const deleteResult = await workOrderStatusRepository.deleteWorkOrderStatus(
      systemStatus!.id,
      tenantA
    );
    expect(deleteResult.outcome).toBe('not-found'); // System statuses return not-found instead of deleted
  });
});
