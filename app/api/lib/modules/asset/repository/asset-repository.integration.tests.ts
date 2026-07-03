import { describe, expect, it } from 'vitest';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetConditionRepository } from '../../asset-condition/repository/asset-condition-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { assetRepository } from './asset-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createAssetStatus = (tenantId: string, name: string, code: string) =>
  assetStatusRepository.createAssetStatus({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

const createAssetCondition = (tenantId: string, name: string, code: string) =>
  assetConditionRepository.createAssetCondition({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

const createAssetCategory = (tenantId: string, name: string, code: string) =>
  assetCategoryRepository.createAssetCategory({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

const createAsset = async (
  tenantId: string,
  name: string,
  serialNumber: string,
  categoryId: number,
  statusId: number,
  conditionId?: number
) => {
  const asset = await assetRepository.createAsset({
    tenantId,
    name,
    serialNumber,
    categoryId,
    statusId,
    conditionId,
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
  });
  if (!asset) throw new Error('createAsset returned no row');
  return asset;
};

describe('Asset repository', () => {
  it('should create asset for a tenant', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Medical Equipment', 'MED');
    const condition = await createAssetCondition(tenantA, 'Good', 'GUD');

    const created = await createAsset(
      tenantA,
      'X-Ray Machine',
      'XM-001',
      category.id,
      status.id,
      condition.id
    );

    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'X-Ray Machine',
      serialNumber: 'XM-001',
      categoryId: category.id,
      statusId: status.id,
      conditionId: condition.id,
      category: expect.objectContaining({ name: 'Medical Equipment' }),
      status: expect.objectContaining({ name: 'Active' }),
      condition: expect.objectContaining({ name: 'Good' }),
    });
  });

  it('should get asset by id for same tenant', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Furniture', 'FRN');
    const created = await createAsset(tenantA, 'Desk Chair', 'DC-001', category.id, status.id);

    const found = await assetRepository.getAssetById(created.id, tenantA);
    expect(found).toMatchObject({
      id: created.id,
      tenantId: tenantA,
      name: 'Desk Chair',
    });
  });

  it('should not get asset by id for another tenant', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Electronics', 'ELC');
    const created = await createAsset(tenantA, 'Laptop', 'LP-001', category.id, status.id);

    const found = await assetRepository.getAssetById(created.id, tenantB);
    expect(found).toBeUndefined();
  });

  it('should list only assets for the requested tenant', async () => {
    const statusA = await createAssetStatus(tenantA, 'Active', 'ACT');
    const statusB = await createAssetStatus(tenantB, 'Active', 'ACT');
    const categoryA = await createAssetCategory(tenantA, 'Vehicles', 'VEH');
    const categoryB = await createAssetCategory(tenantB, 'Buildings', 'BLD');

    await createAsset(tenantA, 'Ambulance', 'AMB-001', categoryA.id, statusA.id);
    await createAsset(tenantB, 'Hospital Wing', 'BLD-001', categoryB.id, statusB.id);

    const result = await assetRepository.getAssets({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted assets', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'IT Equipment', 'IT');

    const created = await createAsset(tenantA, 'Server', 'SRV-001', category.id, status.id);
    await assetRepository.deleteAsset(created.id, tenantA);

    await createAsset(tenantA, 'Router', 'RTR-001', category.id, status.id);

    const result = await assetRepository.getAssets({ tenantId: tenantA });
    expect(result.data.map((a) => a.serialNumber)).toEqual(['RTR-001']);
  });

  it('should soft-delete asset and exclude it from future reads', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Tools', 'TOL');

    const created = await createAsset(tenantA, 'Drill', 'DRL-001', category.id, status.id);
    const deleteResult = await assetRepository.deleteAsset(created.id, tenantA);

    expect(deleteResult.outcome).toBe('deleted');
    expect(deleteResult.outcome === 'deleted' && deleteResult.data?.id).toBe(created.id);

    const found = await assetRepository.getAssetById(created.id, tenantA);
    expect(found).toBeUndefined();
  });

  it('should update only active asset for the requested tenant', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Lab Equipment', 'LAB');

    const created = await createAsset(tenantA, 'Microscope', 'MSC-001', category.id, status.id);

    const updated = await assetRepository.updateAsset(created.id, {
      tenantId: tenantA,
      name: 'Digital Microscope',
      categoryId: category.id,
      statusId: status.id,
      serialNumber: 'MSC-001',
      manufacturer: 'New Manufacturer',
      model: 'New Model',
    });

    expect(updated).toMatchObject({
      name: 'Digital Microscope',
      manufacturer: 'New Manufacturer',
      model: 'New Model',
    });

    await assetRepository.deleteAsset(created.id, tenantA);

    const updateAfterDelete = await assetRepository.updateAsset(created.id, {
      tenantId: tenantA,
      name: 'Updated Microscope',
      categoryId: category.id,
      statusId: status.id,
      serialNumber: 'MSC-001',
    });

    expect(updateAfterDelete).toBeUndefined();
  });

  it("should not update another tenant's asset", async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Safety Equipment', 'SAF');

    const created = await createAsset(
      tenantA,
      'Fire Extinguisher',
      'FE-001',
      category.id,
      status.id
    );

    const updated = await assetRepository.updateAsset(created.id, {
      tenantId: tenantB,
      name: 'Safety Extinguisher',
      categoryId: category.id,
      statusId: status.id,
      serialNumber: 'FE-001',
    });

    expect(updated).toBeUndefined();
  });

  it('should enforce unique serial number per tenant', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Medical Devices', 'MD');

    await createAsset(tenantA, 'Ventilator', 'VENT-001', category.id, status.id);

    await expect(
      createAsset(tenantA, 'Another Ventilator', 'VENT-001', category.id, status.id)
    ).rejects.toMatchObject({
      cause: { code: '23505' },
    });
  });

  it('should allow same serial number across different tenants', async () => {
    const statusA = await createAssetStatus(tenantA, 'Active', 'ACT');
    const statusB = await createAssetStatus(tenantB, 'Active', 'ACT');
    const categoryA = await createAssetCategory(tenantA, 'Equipment', 'EQP');
    const categoryB = await createAssetCategory(tenantB, 'Equipment', 'EQP');

    await createAsset(tenantA, 'Device A', 'DEV-001', categoryA.id, statusA.id);
    await expect(
      createAsset(tenantB, 'Device B', 'DEV-001', categoryB.id, statusB.id)
    ).resolves.toBeTruthy();
  });

  it('should find active asset by serial number case-insensitively', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Instruments', 'INS');

    const created = await createAsset(tenantA, 'Scalpel', 'SCL-001', category.id, status.id);

    const found = await assetRepository.findActiveBySerialNumber(tenantA, 'scl-001');
    expect(found?.id).toBe(created.id);
  });

  it('should not find soft-deleted asset by serial number', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Supplies', 'SUP');

    const created = await createAsset(tenantA, 'Gloves', 'GLV-001', category.id, status.id);
    await assetRepository.deleteAsset(created.id, tenantA);

    const found = await assetRepository.findActiveBySerialNumber(tenantA, 'GLV-001');
    expect(found).toBeUndefined();
  });

  it('should find active asset by serial number excluding id', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Furniture', 'FRN');

    const created1 = await createAsset(tenantA, 'Table A', 'TBL-001', category.id, status.id);
    const created2 = await createAsset(tenantA, 'Table B', 'TBL-002', category.id, status.id);

    const found = await assetRepository.findActiveBySerialNumber(tenantA, 'TBL-001', {
      excludeId: created1.id,
    });
    expect(found).toBeUndefined();
  });

  it('should filter assets by category', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category1 = await createAssetCategory(tenantA, 'Category A', 'CATA');
    const category2 = await createAssetCategory(tenantA, 'Category B', 'CATB');

    await createAsset(tenantA, 'Asset 1', 'AST-001', category1.id, status.id);
    await createAsset(tenantA, 'Asset 2', 'AST-002', category2.id, status.id);

    const result = await assetRepository.getAssets({ tenantId: tenantA, categoryId: category1.id });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.categoryId).toBe(category1.id);
  });

  it('should filter assets by status', async () => {
    const status1 = await createAssetStatus(tenantA, 'Active', 'ACT');
    const status2 = await createAssetStatus(tenantA, 'Inactive', 'INA');
    const category = await createAssetCategory(tenantA, 'General', 'GEN');

    await createAsset(tenantA, 'Active Asset', 'AA-001', category.id, status1.id);
    await createAsset(tenantA, 'Inactive Asset', 'IA-001', category.id, status2.id);

    const result = await assetRepository.getAssets({ tenantId: tenantA, statusId: status1.id });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.statusId).toBe(status1.id);
  });

  it('should search by multiple fields', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Searchable', 'SRC');

    await createAsset(tenantA, 'Test Asset', 'TST-001', category.id, status.id);

    const resultByName = await assetRepository.getAssets({
      tenantId: tenantA,
      query: 'test asset',
    });
    expect(resultByName.data.map((a) => a.name)).toEqual(['Test Asset']);

    const resultBySerial = await assetRepository.getAssets({ tenantId: tenantA, query: 'TST-001' });
    expect(resultBySerial.data.map((a) => a.serialNumber)).toEqual(['TST-001']);
  });

  it('should paginate list results and return total', async () => {
    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Paginated', 'PAG');

    await createAsset(tenantA, 'Asset 1', 'PG-001', category.id, status.id);
    await createAsset(tenantA, 'Asset 2', 'PG-002', category.id, status.id);
    await createAsset(tenantA, 'Asset 3', 'PG-003', category.id, status.id);

    const result = await assetRepository.getAssets({ tenantId: tenantA, page: 2, limit: 2 });
    expect(result.total).toBe(3);
    expect(result.data.map((a) => a.name)).toEqual(['Asset 3']);
  });

  it('should return in-use outcome when deleting asset with active work orders', async () => {
    const { db } = await import('@/app/db');
    const { workOrder: workOrderTable } = await import('@/app/db/schema/work-order');
    const { workOrderType: workOrderTypeTable } = await import('@/app/db/schema/work-order-type');
    const { workOrderPriority: workOrderPriorityTable } =
      await import('@/app/db/schema/work-order-priority');
    const { workOrderStatus: workOrderStatusTable } =
      await import('@/app/db/schema/work-order-status');

    const status = await createAssetStatus(tenantA, 'Active', 'ACT');
    const category = await createAssetCategory(tenantA, 'Test', 'TST');
    const asset = await createAsset(tenantA, 'Test Asset', 'TA-001', category.id, status.id);

    // A work order needs valid type / priority / (non-completed) status references.
    const [woType] = await db
      .insert(workOrderTypeTable)
      .values({ tenantId: tenantA, name: 'Repair', code: 'REP', color: '#FF0000' })
      .returning();
    const [woPriority] = await db
      .insert(workOrderPriorityTable)
      .values({ tenantId: tenantA, name: 'High', code: 'HI', color: '#FF0000' })
      .returning();
    const [woStatus] = await db
      .insert(workOrderStatusTable)
      .values({
        tenantId: tenantA,
        name: 'In Progress',
        code: 'PRG',
        category: 'IN_PROGRESS',
        color: '#FF0000',
      })
      .returning();

    await db.insert(workOrderTable).values({
      tenantId: tenantA,
      code: 'WO-001',
      assetId: asset.id,
      typeId: woType!.id,
      priorityId: woPriority!.id,
      statusId: woStatus!.id,
    });

    const deleteResult = await assetRepository.deleteAsset(asset.id, tenantA);
    expect(deleteResult.outcome).toBe('in-use');
  });
});
