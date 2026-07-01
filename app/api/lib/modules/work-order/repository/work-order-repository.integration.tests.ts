import { describe, expect, it } from 'vitest';

import { assetCategoryRepository } from '../../asset-category/repository/asset-category-repository';
import { assetStatusRepository } from '../../asset-status/repository/asset-status-repository';
import { assetRepository } from '../../asset/repository/asset-repository';
import { workOrderPriorityRepository } from '../../work-order-priority/repository/work-order-priority-repository';
import { workOrderRepository } from './work-order-repository';
import { workOrderStatusRepository } from '../../work-order-status/repository/work-order-status-repository';
import { workOrderTypeRepository } from '../../work-order-type/repository/work-order-type-repository';

const tenantA = 'tenant-a-work-order-test';
const tenantB = 'tenant-b-work-order-test';

const setupTestData = async (tenantId: string) => {
  // Create asset category
  const category = await assetCategoryRepository.createAssetCategory({
    tenantId,
    name: 'Medical Equipment',
    code: 'MED_EQUIP',
    color: '#0066cc',
    description: 'Medical equipment category',
  });

  // Create asset status
  const status = await assetStatusRepository.createAssetStatus({
    tenantId,
    name: 'Active',
    code: 'ACTIVE',
    color: '#00cc66',
    description: 'Asset is active',
  });

  // Create asset
  const asset = (await assetRepository.createAsset({
    tenantId,
    name: 'X-Ray Machine',
    categoryId: category.id,
    statusId: status.id,
    serialNumber: 'XR-12345',
    model: 'XR-2000',
    manufacturer: 'MedTech',
    facility: 'Main Hospital',
    department: 'Radiology',
  }))!;

  // Create work order type
  const type = await workOrderTypeRepository.createWorkOrderType({
    tenantId,
    name: 'Preventive Maintenance',
    code: 'PREVENTIVE',
    color: '#0099ff',
    description: 'Scheduled maintenance',
  });

  // Create work order priority
  const priority = await workOrderPriorityRepository.createWorkOrderPriority({
    tenantId,
    name: 'High',
    code: 'HIGH',
    color: '#ff6600',
    description: 'High priority work order',
  });

  // Create work order status
  const workOrderStatus = await workOrderStatusRepository.createWorkOrderStatus({
    tenantId,
    name: 'Open',
    code: 'OPEN',
    category: 'OPEN',
    color: '#00cc00',
    description: 'Work order is open',
  });

  return { asset, type, priority, status: workOrderStatus };
};

describe('Work-Order repository', () => {
  it('should create work order with valid references', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
      technician: 'John Doe',
      dueDate: '2024-12-31',
      note: 'Quarterly maintenance',
    });

    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data).toMatchObject({
        id: expect.any(Number),
        tenantId: tenantA,
        code: expect.any(String),
        technician: 'John Doe',
        note: 'Quarterly maintenance',
        asset: { id: asset.id, name: asset.name },
        type: { id: type.id, name: type.name },
        priority: { id: priority.id, name: priority.name },
        status: { id: status.id, name: status.name },
      });
    }
  });

  it('should create work order with optional fields omitted', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data.technician).toBeNull();
      expect(created.data.dueDate).toBeNull();
      expect(created.data.note).toBeNull();
    }
  });

  it('should fail to create work order with invalid asset reference', async () => {
    const { type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: 999999,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.invalidReferences).toContain('asset');
    }
  });

  it('should fail to create work order with invalid type reference', async () => {
    const { asset, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: 999999,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.invalidReferences).toContain('type');
    }
  });

  it('should fail to create work order with invalid priority reference', async () => {
    const { asset, type, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: 999999,
      statusId: status.id,
    });

    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.invalidReferences).toContain('priority');
    }
  });

  it('should fail to create work order with invalid status reference', async () => {
    const { asset, type, priority } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: 999999,
    });

    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.invalidReferences).toContain('status');
    }
  });

  it('should fail to create work order with multiple invalid references', async () => {
    const { asset } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: 999998,
      priorityId: 999999,
      statusId: 999997,
    });

    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.invalidReferences).toEqual(
        expect.arrayContaining(['type', 'priority', 'status'])
      );
    }
  });

  it('should get work order by id for same tenant', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    const fetched = await workOrderRepository.getWorkOrderById(created.data.id, tenantA);

    expect(fetched).toMatchObject({
      id: created.data.id,
      tenantId: tenantA,
      assetId: asset.id,
    });
  });

  it('should not get work order by id for another tenant', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    const fetched = await workOrderRepository.getWorkOrderById(created.data.id, tenantB);

    expect(fetched).toBeUndefined();
  });

  it('should list work orders for tenant', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
      note: 'First work order',
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
      note: 'Second work order',
    });

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data.every((wo) => wo.tenantId === tenantA)).toBe(true);
  });

  it('should filter work orders by type', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const type2 = await workOrderTypeRepository.createWorkOrderType({
      tenantId: tenantA,
      name: 'Corrective Maintenance',
      code: 'CORRECTIVE',
      color: '#ff9900',
      description: 'Unscheduled maintenance',
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type2.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      typeId: type.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.typeId).toBe(type.id);
  });

  it('should filter work orders by priority', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const priority2 = await workOrderPriorityRepository.createWorkOrderPriority({
      tenantId: tenantA,
      name: 'Low',
      code: 'LOW',
      color: '#00cc00',
      description: 'Low priority work order',
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority2.id,
      statusId: status.id,
    });

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      priorityId: priority.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.priorityId).toBe(priority.id);
  });

  it('should filter work orders by status', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const status2 = await workOrderStatusRepository.createWorkOrderStatus({
      tenantId: tenantA,
      name: 'In Progress',
      code: 'IN_PROG',
      category: 'IN_PROGRESS',
      color: '#ffcc00',
      description: 'Work order is in progress',
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status2.id,
    });

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      statusId: status.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.statusId).toBe(status.id);
  });

  it('should filter work orders by asset', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    // Create another asset
    const category = await assetCategoryRepository.createAssetCategory({
      tenantId: tenantA,
      name: 'Lab Equipment',
      code: 'LAB_EQUIP',
      color: '#9900cc',
      description: undefined,
    });

    const assetStatus = await assetStatusRepository.createAssetStatus({
      tenantId: tenantA,
      name: 'Operational',
      code: 'OPERATNL',
      color: '#00cc66',
      description: undefined,
    });

    const asset2 = (await assetRepository.createAsset({
      tenantId: tenantA,
      name: 'Centrifuge',
      categoryId: category.id,
      statusId: assetStatus.id,
      serialNumber: 'CF-98765',
      model: 'CF-500',
      facility: 'Main Hospital',
      department: 'Laboratory',
    }))!;

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset2.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      assetId: asset.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.assetId).toBe(asset.id);
  });

  it('should search work orders by code, asset name, technician, or note', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
      technician: 'Jane Smith',
      note: 'Emergency repair needed',
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    // Search by code (partial match)
    let result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      query: created.data.code.slice(0, 4),
    });
    expect(result.data).toHaveLength(1);

    // Search by asset name
    result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      query: 'X-Ray',
    });
    expect(result.data).toHaveLength(1);

    // Search by technician
    result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      query: 'Jane',
    });
    expect(result.data).toHaveLength(1);

    // Search by note
    result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      query: 'Emergency',
    });
    expect(result.data).toHaveLength(1);
  });

  it('should paginate work orders', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    for (let i = 0; i < 5; i++) {
      await workOrderRepository.createWorkOrder({
        tenantId: tenantA,
        assetId: asset.id,
        typeId: type.id,
        priorityId: priority.id,
        statusId: status.id,
        note: `Work order ${i + 1}`,
      });
    }

    const page1 = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(page1.total).toBe(5);
    expect(page1.data).toHaveLength(2);

    const page2 = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(page2.data).toHaveLength(2);

    const page3 = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
      page: 3,
      limit: 2,
    });

    expect(page3.data).toHaveLength(1);
  });

  it('should check if type is in use', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const isInUse = await workOrderRepository.isTypeInUse(type.id, tenantA);
    expect(isInUse).toBe(true);

    const notInUse = await workOrderRepository.isTypeInUse(999999, tenantA);
    expect(notInUse).toBe(false);
  });

  it('should check if priority is in use', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const isInUse = await workOrderRepository.isPriorityInUse(priority.id, tenantA);
    expect(isInUse).toBe(true);

    const notInUse = await workOrderRepository.isPriorityInUse(999999, tenantA);
    expect(notInUse).toBe(false);
  });

  it('should check if status is in use', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const isInUse = await workOrderRepository.isStatusInUse(status.id, tenantA);
    expect(isInUse).toBe(true);

    const notInUse = await workOrderRepository.isStatusInUse(999999, tenantA);
    expect(notInUse).toBe(false);
  });

  it('should check if asset has active work orders', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    const hasActive = await workOrderRepository.hasActiveWorkOrdersForAsset(asset.id, tenantA);
    expect(hasActive).toBe(true);
  });

  it('should not count completed work orders as active for asset', async () => {
    const { asset, type, priority } = await setupTestData(tenantA);

    // Create a "Completed" status
    const completedStatus = await workOrderStatusRepository.createWorkOrderStatus({
      tenantId: tenantA,
      name: 'Completed',
      code: 'COMPLETED',
      category: 'COMPLETED',
      color: '#00cc00',
      description: undefined,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: completedStatus.id,
    });

    const hasActive = await workOrderRepository.hasActiveWorkOrdersForAsset(asset.id, tenantA);
    expect(hasActive).toBe(false);
  });

  it('should not list soft-deleted work orders', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
      note: 'To be deleted',
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    // Soft delete the work order
    const { db } = await import('@/app/db');
    const { workOrder: workOrderTable } = await import('@/app/db/schema/work-order');
    const { eq } = await import('drizzle-orm');
    await db
      .update(workOrderTable)
      .set({ isDeleted: true })
      .where(eq(workOrderTable.id, created.data.id));

    const result = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
    });

    expect(result.data).toHaveLength(0);
  });

  it('should enforce tenant isolation', async () => {
    const setupA = await setupTestData(tenantA);
    const setupB = await setupTestData(tenantB);

    await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: setupA.asset.id,
      typeId: setupA.type.id,
      priorityId: setupA.priority.id,
      statusId: setupA.status.id,
    });

    await workOrderRepository.createWorkOrder({
      tenantId: tenantB,
      assetId: setupB.asset.id,
      typeId: setupB.type.id,
      priorityId: setupB.priority.id,
      statusId: setupB.status.id,
    });

    const resultA = await workOrderRepository.getWorkOrders({
      tenantId: tenantA,
    });
    const resultB = await workOrderRepository.getWorkOrders({
      tenantId: tenantB,
    });

    expect(resultA.data).toHaveLength(1);
    expect(resultB.data).toHaveLength(1);
    expect(resultA.data.every((wo) => wo.tenantId === tenantA)).toBe(true);
    expect(resultB.data.every((wo) => wo.tenantId === tenantB)).toBe(true);
  });

  it('should generate unique work order codes', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const codes = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const created = await workOrderRepository.createWorkOrder({
        tenantId: tenantA,
        assetId: asset.id,
        typeId: type.id,
        priorityId: priority.id,
        statusId: status.id,
      });
      expect(created.success).toBe(true);
      if (created.success) {
        codes.add(created.data.code);
      }
    }

    // All codes should be unique
    expect(codes.size).toBe(5);
  });

  it('should set completedOn to null for non-completed statuses', async () => {
    const { asset, type, priority, status } = await setupTestData(tenantA);

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: status.id,
    });

    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data.completedOn).toBeNull();
    }
  });

  it('should set completedOn for completed status', async () => {
    const { asset, type, priority } = await setupTestData(tenantA);

    const completedStatus = await workOrderStatusRepository.createWorkOrderStatus({
      tenantId: tenantA,
      name: 'Completed',
      code: 'COMPLETED',
      category: 'COMPLETED',
      color: '#00cc00',
      description: undefined,
    });

    const created = await workOrderRepository.createWorkOrder({
      tenantId: tenantA,
      assetId: asset.id,
      typeId: type.id,
      priorityId: priority.id,
      statusId: completedStatus.id,
    });

    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data.completedOn).toBeInstanceOf(Date);
    }
  });
});
