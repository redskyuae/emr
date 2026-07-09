import { describe, expect, it } from 'vitest';

import type { VisitStatusCategory } from '../schemas/visit-status-schema';

import { visitStatusRepository } from './visit-status-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createStatus = (
  tenantId: string,
  name: string,
  code: string,
  category: VisitStatusCategory
) =>
  visitStatusRepository.createVisitStatus({
    tenantId,
    name,
    code,
    category,
    color: '#FF0000',
    description: undefined,
  });

describe('VisitStatus repository', () => {
  it('should create visit status for a tenant', async () => {
    const created = await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Waiting',
      code: 'WAIT',
      category: 'WAITING',
      color: '#FF0000',
      isSystem: false,
    });
  });

  it('should get visit status by id for same tenant', async () => {
    const created = await createStatus(tenantA, 'In Progress', 'PRG', 'IN_PROGRESS');
    await expect(
      visitStatusRepository.getVisitStatusById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get visit status by id for another tenant', async () => {
    const created = await createStatus(tenantA, 'Pending', 'PND', 'WAITING');
    await expect(
      visitStatusRepository.getVisitStatusById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only visit statuses for the requested tenant', async () => {
    await createStatus(tenantA, 'Closed', 'CLS', 'COMPLETED');
    await createStatus(tenantB, 'Resolved', 'RES', 'COMPLETED');
    const result = await visitStatusRepository.getVisitStatuses({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted visit statuses', async () => {
    const deleted = await createStatus(tenantA, 'On Hold', 'HLD', 'WAITING');
    const deleteResult = await visitStatusRepository.deleteVisitStatus(deleted.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    await createStatus(tenantA, 'Cancelled', 'CAN', 'CANCELLED');
    const result = await visitStatusRepository.getVisitStatuses({ tenantId: tenantA });
    expect(result.data.map((s) => s.code)).toEqual(['CAN']);
  });

  it('should soft-delete visit status and exclude it from future reads', async () => {
    const created = await createStatus(tenantA, 'Completed', 'CMP', 'COMPLETED');
    const deleteResult = await visitStatusRepository.deleteVisitStatus(created.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    expect(deleteResult.outcome === 'deleted' && deleteResult.data?.id).toBe(created.id);
    await expect(
      visitStatusRepository.getVisitStatusById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active visit status for the requested tenant', async () => {
    const created = await createStatus(tenantA, 'Review', 'RVW', 'IN_PROGRESS');
    const updateResult = await visitStatusRepository.updateVisitStatus(created.id, {
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

    await visitStatusRepository.deleteVisitStatus(created.id, tenantA);
    const updateAfterDelete = await visitStatusRepository.updateVisitStatus(created.id, {
      tenantId: tenantA,
      name: 'Review',
      code: 'RVW',
      category: 'IN_PROGRESS',
      color: '#FF0000',
      description: undefined,
    });
    expect(updateAfterDelete.outcome).toBe('not-found');
  });

  it("should not update another tenant's visit status", async () => {
    const created = await createStatus(tenantA, 'Approved', 'APR', 'COMPLETED');
    const updateResult = await visitStatusRepository.updateVisitStatus(created.id, {
      tenantId: tenantB,
      name: 'Rejected',
      code: 'REJ',
      category: 'CANCELLED',
      color: '#FF0000',
      description: undefined,
    });
    expect(updateResult.outcome).toBe('not-found');
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    await expect(createStatus(tenantA, 'waiting', 'WAIT2', 'WAITING')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'visit_status_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    await expect(createStatus(tenantA, 'Closed', 'wait', 'COMPLETED')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'visit_status_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    await expect(createStatus(tenantB, 'Waiting', 'WAIT', 'WAITING')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    await visitStatusRepository.deleteVisitStatus(created.id, tenantA);
    await expect(createStatus(tenantA, 'waiting', 'wait', 'WAITING')).resolves.toMatchObject({
      name: 'waiting',
      code: 'wait',
    });
  });

  it('should search by name and code', async () => {
    await createStatus(tenantA, 'Waiting', 'WAIT', 'WAITING');
    await createStatus(tenantA, 'In Progress', 'PRG', 'IN_PROGRESS');
    expect(
      (await visitStatusRepository.getVisitStatuses({ tenantId: tenantA, query: 'prog' })).data.map(
        (s) => s.code
      )
    ).toEqual(['PRG']);
    expect(
      (await visitStatusRepository.getVisitStatuses({ tenantId: tenantA, query: 'WAIT' })).data.map(
        (s) => s.name
      )
    ).toEqual(['Waiting']);
  });

  it('should paginate list results and return total', async () => {
    await createStatus(tenantA, 'Alpha', 'A', 'WAITING');
    await createStatus(tenantA, 'Bravo', 'B', 'IN_PROGRESS');
    await createStatus(tenantA, 'Charlie', 'C', 'COMPLETED');
    const result = await visitStatusRepository.getVisitStatuses({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((status) => status.name)).toEqual(['Charlie']);
  });

  it('should return not-found outcome when deleting a system status', async () => {
    const { db } = await import('@/app/db');
    const { visitStatus: visitStatusTable } = await import('@/app/db/schema/visit-status');

    const [systemStatus] = await db
      .insert(visitStatusTable)
      .values({
        tenantId: tenantA,
        name: 'System Status',
        code: 'SYS',
        category: 'WAITING',
        color: '#FF0000',
        isSystem: true,
      })
      .returning({ id: visitStatusTable.id });

    const deleteResult = await visitStatusRepository.deleteVisitStatus(systemStatus!.id, tenantA);
    expect(deleteResult.outcome).toBe('not-found');
  });

  it('should return the system status for a category', async () => {
    await createStatus(tenantA, 'Custom Waiting', 'CWT', 'WAITING');
    const { db } = await import('@/app/db');
    const { visitStatus: visitStatusTable } = await import('@/app/db/schema/visit-status');

    await db.insert(visitStatusTable).values({
      tenantId: tenantA,
      name: 'Waiting',
      code: 'WAIT',
      category: 'WAITING',
      color: '#FF0000',
      isSystem: true,
    });

    await expect(
      visitStatusRepository.getSystemVisitStatusByCategory(tenantA, 'WAITING')
    ).resolves.toMatchObject({ code: 'WAIT', isSystem: true });
  });
});
