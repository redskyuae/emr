import { describe, expect, it } from 'vitest';

import { assetCategoryRepository } from './asset-category-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createCategory = (tenantId: string, name: string, code: string) =>
  assetCategoryRepository.createAssetCategory({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

describe('AssetCategory repository', () => {
  it('should create asset category for a tenant', async () => {
    const created = await createCategory(tenantA, 'Medical Equipment', 'MED');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Medical Equipment',
      code: 'MED',
      color: '#FF0000',
    });
  });

  it('should get asset category by id for same tenant', async () => {
    const created = await createCategory(tenantA, 'Furniture', 'FRN');
    await expect(
      assetCategoryRepository.getAssetCategoryById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
    });
  });

  it('should not get asset category by id for another tenant', async () => {
    const created = await createCategory(tenantA, 'Electronics', 'ELC');
    await expect(
      assetCategoryRepository.getAssetCategoryById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only asset categories for the requested tenant', async () => {
    await createCategory(tenantA, 'Vehicles', 'VEH');
    await createCategory(tenantB, 'Buildings', 'BLD');
    const result = await assetCategoryRepository.getAssetCategories({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted asset categories', async () => {
    const deleted = await createCategory(tenantA, 'IT Equipment', 'IT');
    await assetCategoryRepository.deleteAssetCategory(deleted.id, tenantA);
    await createCategory(tenantA, 'Office Supplies', 'OFF');
    const result = await assetCategoryRepository.getAssetCategories({ tenantId: tenantA });
    expect(result.data.map((c) => c.code)).toEqual(['OFF']);
  });

  it('should soft-delete asset category and exclude it from future reads', async () => {
    const created = await createCategory(tenantA, 'Tools', 'TOL');
    await expect(
      assetCategoryRepository.deleteAssetCategory(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      assetCategoryRepository.getAssetCategoryById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active asset category for the requested tenant', async () => {
    const created = await createCategory(tenantA, 'Lab Equipment', 'LAB');
    await expect(
      assetCategoryRepository.updateAssetCategory(created.id, {
        tenantId: tenantA,
        name: 'Laboratory Equipment',
        code: 'LBE',
        color: '#00FF00',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Laboratory Equipment', code: 'LBE', color: '#00FF00' });
    await assetCategoryRepository.deleteAssetCategory(created.id, tenantA);
    await expect(
      assetCategoryRepository.updateAssetCategory(created.id, {
        tenantId: tenantA,
        name: 'Lab Equipment',
        code: 'LAB',
        color: '#FF0000',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's asset category", async () => {
    const created = await createCategory(tenantA, 'Safety Equipment', 'SAF');
    await expect(
      assetCategoryRepository.updateAssetCategory(created.id, {
        tenantId: tenantB,
        name: 'Protective Gear',
        code: 'PRT',
        color: '#0000FF',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createCategory(tenantA, 'Medical Equipment', 'MED');
    await expect(createCategory(tenantA, 'medical equipment', 'MED2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_category_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createCategory(tenantA, 'Medical Equipment', 'MED');
    await expect(createCategory(tenantA, 'Furniture', 'med')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_category_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createCategory(tenantA, 'Medical Equipment', 'MED');
    await expect(createCategory(tenantB, 'Medical Equipment', 'MED')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createCategory(tenantA, 'Medical Equipment', 'MED');
    await assetCategoryRepository.deleteAssetCategory(created.id, tenantA);
    await expect(createCategory(tenantA, 'medical equipment', 'med')).resolves.toMatchObject({
      name: 'medical equipment',
      code: 'med',
    });
  });

  it('should search by name and code', async () => {
    await createCategory(tenantA, 'Medical Equipment', 'MED');
    await createCategory(tenantA, 'Furniture', 'FRN');
    expect(
      (
        await assetCategoryRepository.getAssetCategories({ tenantId: tenantA, query: 'frn' })
      ).data.map((c) => c.code)
    ).toEqual(['FRN']);
    expect(
      (
        await assetCategoryRepository.getAssetCategories({ tenantId: tenantA, query: 'MED' })
      ).data.map((c) => c.name)
    ).toEqual(['Medical Equipment']);
  });

  it('should paginate list results and return total', async () => {
    await createCategory(tenantA, 'Alpha', 'A');
    await createCategory(tenantA, 'Bravo', 'B');
    await createCategory(tenantA, 'Charlie', 'C');
    const result = await assetCategoryRepository.getAssetCategories({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((category) => category.name)).toEqual(['Charlie']);
  });
});
