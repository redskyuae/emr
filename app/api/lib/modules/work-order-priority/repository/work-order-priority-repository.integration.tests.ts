import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { workOrder as workOrderTable } from '@/app/db/schema/work-order';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { assetRepository } from '../../asset/repository/asset-repository';
import { workOrderStatusRepository } from '../../work-order-status/repository/work-order-status-repository';
import { workOrderTypeRepository } from '../../work-order-type/repository/work-order-type-repository';
import { workOrderPriorityRepository } from './work-order-priority-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createPriority = (tenantId: string, name: string, code: string) =>
  workOrderPriorityRepository.createWorkOrderPriority({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

describe('WorkOrderPriority repository', () => {
  it('should create work order priority for a tenant', async () => {
    const created = await createPriority(tenantA, 'High', 'HGH');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'High',
      code: 'HGH',
      color: '#FF0000',
    });
  });

  it('should get work order priority by id for same tenant', async () => {
    const created = await createPriority(tenantA, 'Medium', 'MED');
    await expect(
      workOrderPriorityRepository.getWorkOrderPriorityById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get work order priority by id for another tenant', async () => {
    const created = await createPriority(tenantA, 'Low', 'LOW');
    await expect(
      workOrderPriorityRepository.getWorkOrderPriorityById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only work order priorities for the requested tenant', async () => {
    await createPriority(tenantA, 'Critical', 'CRT');
    await createPriority(tenantB, 'Urgent', 'URG');
    const result = await workOrderPriorityRepository.getWorkOrderPriorities({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted work order priorities', async () => {
    const deleted = await createPriority(tenantA, 'Emergency', 'EMG');
    const deleteResult = await workOrderPriorityRepository.deleteWorkOrderPriority(
      deleted.id,
      tenantA
    );
    expect(deleteResult.outcome).toBe('deleted');
    await createPriority(tenantA, 'Routine', 'RTN');
    const result = await workOrderPriorityRepository.getWorkOrderPriorities({ tenantId: tenantA });
    expect(result.data.map((p) => p.code)).toEqual(['RTN']);
  });

  it('should soft-delete work order priority and exclude it from future reads', async () => {
    const created = await createPriority(tenantA, 'Trivial', 'TRV');
    const deleteResult = await workOrderPriorityRepository.deleteWorkOrderPriority(
      created.id,
      tenantA
    );
    expect(deleteResult.outcome).toBe('deleted');
    expect(deleteResult.outcome === 'deleted' && deleteResult.data?.id).toBe(created.id);
    await expect(
      workOrderPriorityRepository.getWorkOrderPriorityById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active work order priority for the requested tenant', async () => {
    const created = await createPriority(tenantA, 'Normal', 'NRM');
    const updateResult = await workOrderPriorityRepository.updateWorkOrderPriority(created.id, {
      tenantId: tenantA,
      name: 'Standard',
      code: 'STD',
      color: '#00FF00',
      description: undefined,
    });
    expect(updateResult).toMatchObject({ name: 'Standard', code: 'STD', color: '#00FF00' });

    await workOrderPriorityRepository.deleteWorkOrderPriority(created.id, tenantA);
    const updateAfterDelete = await workOrderPriorityRepository.updateWorkOrderPriority(
      created.id,
      {
        tenantId: tenantA,
        name: 'Normal',
        code: 'NRM',
        color: '#FF0000',
        description: undefined,
      }
    );
    expect(updateAfterDelete).toBeUndefined();
  });

  it("should not update another tenant's work order priority", async () => {
    const created = await createPriority(tenantA, 'Optional', 'OPT');
    const updateResult = await workOrderPriorityRepository.updateWorkOrderPriority(created.id, {
      tenantId: tenantB,
      name: ' discretionary',
      code: 'DSC',
      color: '#0000FF',
      description: undefined,
    });
    expect(updateResult).toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createPriority(tenantA, 'High', 'HGH');
    await expect(createPriority(tenantA, 'high', 'HGH2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_priority_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createPriority(tenantA, 'High', 'HGH');
    await expect(createPriority(tenantA, 'Medium', 'hgh')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_priority_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createPriority(tenantA, 'High', 'HGH');
    await expect(createPriority(tenantB, 'High', 'HGH')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createPriority(tenantA, 'High', 'HGH');
    await workOrderPriorityRepository.deleteWorkOrderPriority(created.id, tenantA);
    await expect(createPriority(tenantA, 'high', 'hgh')).resolves.toMatchObject({
      name: 'high',
      code: 'hgh',
    });
  });

  it('should search by name and code', async () => {
    await createPriority(tenantA, 'High', 'HGH');
    await createPriority(tenantA, 'Medium', 'MED');
    expect(
      (
        await workOrderPriorityRepository.getWorkOrderPriorities({
          tenantId: tenantA,
          query: 'med',
        })
      ).data.map((p) => p.code)
    ).toEqual(['MED']);
    expect(
      (
        await workOrderPriorityRepository.getWorkOrderPriorities({
          tenantId: tenantA,
          query: 'HGH',
        })
      ).data.map((p) => p.name)
    ).toEqual(['High']);
  });

  it('should paginate list results and return total', async () => {
    await createPriority(tenantA, 'Alpha', 'A');
    await createPriority(tenantA, 'Bravo', 'B');
    await createPriority(tenantA, 'Charlie', 'C');
    const result = await workOrderPriorityRepository.getWorkOrderPriorities({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((priority) => priority.name)).toEqual(['Charlie']);
  });

  it('should return in-use outcome when deleting priority that is in use by work orders', async () => {
    const category = await assetCategoryRepository.createAssetCategory({
      tenantId: tenantA,
      name: 'Medical Equipment',
      code: 'MED_EQUIP',
      color: '#0066cc',
      description: undefined,
    });
    const assetStatus = await assetStatusRepository.createAssetStatus({
      tenantId: tenantA,
      name: 'Active',
      code: 'ACTIVE',
      color: '#00cc66',
      description: undefined,
    });
    const asset = (await assetRepository.createAsset({
      tenantId: tenantA,
      name: 'X-Ray Machine',
      categoryId: category.id,
      statusId: assetStatus.id,
      serialNumber: 'XR-12345',
    }))!;
    const type = await workOrderTypeRepository.createWorkOrderType({
      tenantId: tenantA,
      name: 'Preventive Maintenance',
      code: 'PREVENTIVE',
      color: '#0099ff',
      description: undefined,
    });
    const status = await workOrderStatusRepository.createWorkOrderStatus({
      tenantId: tenantA,
      name: 'Open',
      code: 'OPEN',
      category: 'OPEN',
      color: '#00cc00',
      description: undefined,
    });

    const created = await createPriority(tenantA, 'Test Priority', 'TST');

    // Create a work order that uses this priority
    await db.insert(workOrderTable).values({
      tenantId: tenantA,
      code: 'WO-0001',
      assetId: asset.id,
      typeId: type.id,
      priorityId: created.id,
      statusId: status.id,
    });

    const deleteResult = await workOrderPriorityRepository.deleteWorkOrderPriority(
      created.id,
      tenantA
    );
    expect(deleteResult.outcome).toBe('in-use');
  });
});
