import { describe, expect, it } from 'vitest';

import { assetConditionRepository } from './asset-condition-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createCondition = (tenantId: string, name: string, code: string) =>
  assetConditionRepository.createAssetCondition({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

describe('AssetCondition repository', () => {
  it('should create asset condition for a tenant', async () => {
    const created = await createCondition(tenantA, 'New', 'NEW');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'New',
      code: 'NEW',
      color: '#FF0000',
    });
  });

  it('should get asset condition by id for same tenant', async () => {
    const created = await createCondition(tenantA, 'Good', 'GUD');
    await expect(
      assetConditionRepository.getAssetConditionById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
    });
  });

  it('should not get asset condition by id for another tenant', async () => {
    const created = await createCondition(tenantA, 'Fair', 'FAR');
    await expect(
      assetConditionRepository.getAssetConditionById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only asset conditions for the requested tenant', async () => {
    await createCondition(tenantA, 'Poor', 'POR');
    await createCondition(tenantB, 'Excellent', 'EXC');
    const result = await assetConditionRepository.getAssetConditions({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted asset conditions', async () => {
    const deleted = await createCondition(tenantA, 'Broken', 'BRK');
    await assetConditionRepository.deleteAssetCondition(deleted.id, tenantA);
    await createCondition(tenantA, 'Damaged', 'DMD');
    const result = await assetConditionRepository.getAssetConditions({ tenantId: tenantA });
    expect(result.data.map((c) => c.code)).toEqual(['DMD']);
  });

  it('should soft-delete asset condition and exclude it from future reads', async () => {
    const created = await createCondition(tenantA, 'Destroyed', 'DST');
    await expect(
      assetConditionRepository.deleteAssetCondition(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      assetConditionRepository.getAssetConditionById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active asset condition for the requested tenant', async () => {
    const created = await createCondition(tenantA, 'Like New', 'LKN');
    await expect(
      assetConditionRepository.updateAssetCondition(created.id, {
        tenantId: tenantA,
        name: 'Almost New',
        code: 'ALN',
        color: '#00FF00',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Almost New', code: 'ALN', color: '#00FF00' });
    await assetConditionRepository.deleteAssetCondition(created.id, tenantA);
    await expect(
      assetConditionRepository.updateAssetCondition(created.id, {
        tenantId: tenantA,
        name: 'Like New',
        code: 'LKN',
        color: '#FF0000',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's asset condition", async () => {
    const created = await createCondition(tenantA, 'Worn', 'WRN');
    await expect(
      assetConditionRepository.updateAssetCondition(created.id, {
        tenantId: tenantB,
        name: 'Used',
        code: 'USD',
        color: '#0000FF',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createCondition(tenantA, 'New', 'NEW');
    await expect(createCondition(tenantA, 'new', 'NEW2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_condition_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createCondition(tenantA, 'New', 'NEW');
    await expect(createCondition(tenantA, 'Good', 'new')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_condition_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createCondition(tenantA, 'New', 'NEW');
    await expect(createCondition(tenantB, 'New', 'NEW')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createCondition(tenantA, 'New', 'NEW');
    await assetConditionRepository.deleteAssetCondition(created.id, tenantA);
    await expect(createCondition(tenantA, 'new', 'new')).resolves.toMatchObject({
      name: 'new',
      code: 'new',
    });
  });

  it('should search by name and code', async () => {
    await createCondition(tenantA, 'New', 'NEW');
    await createCondition(tenantA, 'Good', 'GUD');
    expect(
      (
        await assetConditionRepository.getAssetConditions({ tenantId: tenantA, query: 'gud' })
      ).data.map((c) => c.code)
    ).toEqual(['GUD']);
    expect(
      (
        await assetConditionRepository.getAssetConditions({ tenantId: tenantA, query: 'NEW' })
      ).data.map((c) => c.name)
    ).toEqual(['New']);
  });

  it('should paginate list results and return total', async () => {
    await createCondition(tenantA, 'Alpha', 'A');
    await createCondition(tenantA, 'Bravo', 'B');
    await createCondition(tenantA, 'Charlie', 'C');
    const result = await assetConditionRepository.getAssetConditions({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((condition) => condition.name)).toEqual(['Charlie']);
  });
});
