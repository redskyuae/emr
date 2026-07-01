import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { workOrder as workOrderTable } from '@/app/db/schema/work-order';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { assetRepository } from '../../asset/repository/asset-repository';
import { workOrderPriorityRepository } from '../../work-order-priority/repository/work-order-priority-repository';
import { workOrderStatusRepository } from '../../work-order-status/repository/work-order-status-repository';
import { workOrderTypeRepository } from './work-order-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createType = (tenantId: string, name: string, code: string) =>
  workOrderTypeRepository.createWorkOrderType({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

describe('WorkOrderType repository', () => {
  it('should create work order type for a tenant', async () => {
    const created = await createType(tenantA, 'Maintenance', 'MNT');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Maintenance',
      code: 'MNT',
      color: '#FF0000',
    });
  });

  it('should get work order type by id for same tenant', async () => {
    const created = await createType(tenantA, 'Repair', 'REP');
    await expect(
      workOrderTypeRepository.getWorkOrderTypeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get work order type by id for another tenant', async () => {
    const created = await createType(tenantA, 'Installation', 'INS');
    await expect(
      workOrderTypeRepository.getWorkOrderTypeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only work order types for the requested tenant', async () => {
    await createType(tenantA, 'Inspection', 'INP');
    await createType(tenantB, 'Upgrade', 'UPG');
    const result = await workOrderTypeRepository.getWorkOrderTypes({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted work order types', async () => {
    const deleted = await createType(tenantA, 'Replacement', 'RPL');
    const deleteResult = await workOrderTypeRepository.deleteWorkOrderType(deleted.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    await createType(tenantA, 'Calibration', 'CAL');
    const result = await workOrderTypeRepository.getWorkOrderTypes({ tenantId: tenantA });
    expect(result.data.map((t) => t.code)).toEqual(['CAL']);
  });

  it('should soft-delete work order type and exclude it from future reads', async () => {
    const created = await createType(tenantA, 'Modification', 'MOD');
    const deleteResult = await workOrderTypeRepository.deleteWorkOrderType(created.id, tenantA);
    expect(deleteResult.outcome).toBe('deleted');
    expect(deleteResult.outcome === 'deleted' && deleteResult.data?.id).toBe(created.id);
    await expect(
      workOrderTypeRepository.getWorkOrderTypeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active work order type for the requested tenant', async () => {
    const created = await createType(tenantA, 'Refurbishment', 'REF');
    const updateResult = await workOrderTypeRepository.updateWorkOrderType(created.id, {
      tenantId: tenantA,
      name: 'Refurbish',
      code: 'RFB',
      color: '#00FF00',
      description: undefined,
    });
    expect(updateResult).toMatchObject({ name: 'Refurbish', code: 'RFB', color: '#00FF00' });

    await workOrderTypeRepository.deleteWorkOrderType(created.id, tenantA);
    const updateAfterDelete = await workOrderTypeRepository.updateWorkOrderType(created.id, {
      tenantId: tenantA,
      name: 'Refurbishment',
      code: 'REF',
      color: '#FF0000',
      description: undefined,
    });
    expect(updateAfterDelete).toBeUndefined();
  });

  it("should not update another tenant's work order type", async () => {
    const created = await createType(tenantA, 'Overhaul', 'OVH');
    const updateResult = await workOrderTypeRepository.updateWorkOrderType(created.id, {
      tenantId: tenantB,
      name: 'Rebuild',
      code: 'BLD',
      color: '#0000FF',
      description: undefined,
    });
    expect(updateResult).toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createType(tenantA, 'Maintenance', 'MNT');
    await expect(createType(tenantA, 'maintenance', 'MNT2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_type_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createType(tenantA, 'Maintenance', 'MNT');
    await expect(createType(tenantA, 'Repair', 'mnt')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'work_order_type_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createType(tenantA, 'Maintenance', 'MNT');
    await expect(createType(tenantB, 'Maintenance', 'MNT')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createType(tenantA, 'Maintenance', 'MNT');
    await workOrderTypeRepository.deleteWorkOrderType(created.id, tenantA);
    await expect(createType(tenantA, 'maintenance', 'mnt')).resolves.toMatchObject({
      name: 'maintenance',
      code: 'mnt',
    });
  });

  it('should search by name and code', async () => {
    await createType(tenantA, 'Maintenance', 'MNT');
    await createType(tenantA, 'Repair', 'REP');
    expect(
      (
        await workOrderTypeRepository.getWorkOrderTypes({ tenantId: tenantA, query: 'rep' })
      ).data.map((t) => t.code)
    ).toEqual(['REP']);
    expect(
      (
        await workOrderTypeRepository.getWorkOrderTypes({ tenantId: tenantA, query: 'MNT' })
      ).data.map((t) => t.name)
    ).toEqual(['Maintenance']);
  });

  it('should paginate list results and return total', async () => {
    await createType(tenantA, 'Alpha', 'A');
    await createType(tenantA, 'Bravo', 'B');
    await createType(tenantA, 'Charlie', 'C');
    const result = await workOrderTypeRepository.getWorkOrderTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((type) => type.name)).toEqual(['Charlie']);
  });

  it('should return in-use outcome when deleting type that is in use by work orders', async () => {
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
    const priority = await workOrderPriorityRepository.createWorkOrderPriority({
      tenantId: tenantA,
      name: 'High',
      code: 'HIGH',
      color: '#ff6600',
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

    const created = await createType(tenantA, 'Test Type', 'TST');

    // Create a work order that uses this type
    await db.insert(workOrderTable).values({
      tenantId: tenantA,
      code: 'WO-0001',
      assetId: asset.id,
      typeId: created.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const deleteResult = await workOrderTypeRepository.deleteWorkOrderType(created.id, tenantA);
    expect(deleteResult.outcome).toBe('in-use');
  });
});
