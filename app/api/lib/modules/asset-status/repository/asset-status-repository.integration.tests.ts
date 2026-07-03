import { describe, expect, it } from 'vitest';

import { assetStatusRepository } from './asset-status-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createStatus = (tenantId: string, name: string, code: string) =>
  assetStatusRepository.createAssetStatus({
    tenantId,
    name,
    code,
    color: '#FF0000',
    description: undefined,
  });

describe('AssetStatus repository', () => {
  it('should create asset status for a tenant', async () => {
    const created = await createStatus(tenantA, 'Active', 'ACT');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Active',
      code: 'ACT',
      color: '#FF0000',
    });
  });

  it('should get asset status by id for same tenant', async () => {
    const created = await createStatus(tenantA, 'Inactive', 'INA');
    await expect(
      assetStatusRepository.getAssetStatusById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
    });
  });

  it('should not get asset status by id for another tenant', async () => {
    const created = await createStatus(tenantA, 'Reserved', 'RES');
    await expect(
      assetStatusRepository.getAssetStatusById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only asset statuses for the requested tenant', async () => {
    await createStatus(tenantA, 'Available', 'AVL');
    await createStatus(tenantB, 'Unavailable', 'UNA');
    const result = await assetStatusRepository.getAssetStatuses({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted asset statuses', async () => {
    const deleted = await createStatus(tenantA, 'Retired', 'RET');
    await assetStatusRepository.deleteAssetStatus(deleted.id, tenantA);
    await createStatus(tenantA, 'In Transit', 'TRN');
    const result = await assetStatusRepository.getAssetStatuses({ tenantId: tenantA });
    expect(result.data.map((s) => s.code)).toEqual(['TRN']);
  });

  it('should soft-delete asset status and exclude it from future reads', async () => {
    const created = await createStatus(tenantA, 'Lost', 'LST');
    await expect(
      assetStatusRepository.deleteAssetStatus(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      assetStatusRepository.getAssetStatusById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active asset status for the requested tenant', async () => {
    const created = await createStatus(tenantA, 'Stolen', 'STL');
    await expect(
      assetStatusRepository.updateAssetStatus(created.id, {
        tenantId: tenantA,
        name: 'Missing',
        code: 'MIS',
        color: '#00FF00',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Missing', code: 'MIS', color: '#00FF00' });
    await assetStatusRepository.deleteAssetStatus(created.id, tenantA);
    await expect(
      assetStatusRepository.updateAssetStatus(created.id, {
        tenantId: tenantA,
        name: 'Stolen',
        code: 'STL',
        color: '#FF0000',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's asset status", async () => {
    const created = await createStatus(tenantA, 'Damaged', 'DMD');
    await expect(
      assetStatusRepository.updateAssetStatus(created.id, {
        tenantId: tenantB,
        name: 'Broken',
        code: 'BRK',
        color: '#0000FF',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createStatus(tenantA, 'Active', 'ACT');
    await expect(createStatus(tenantA, 'active', 'ACT2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_status_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createStatus(tenantA, 'Active', 'ACT');
    await expect(createStatus(tenantA, 'Inactive', 'act')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'asset_status_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createStatus(tenantA, 'Active', 'ACT');
    await expect(createStatus(tenantB, 'Active', 'ACT')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createStatus(tenantA, 'Active', 'ACT');
    await assetStatusRepository.deleteAssetStatus(created.id, tenantA);
    await expect(createStatus(tenantA, 'active', 'act')).resolves.toMatchObject({
      name: 'active',
      code: 'act',
    });
  });

  it('should search by name and code', async () => {
    await createStatus(tenantA, 'Active', 'ACT');
    await createStatus(tenantA, 'Suspended', 'INA');
    expect(
      (await assetStatusRepository.getAssetStatuses({ tenantId: tenantA, query: 'ina' })).data.map(
        (s) => s.code
      )
    ).toEqual(['INA']);
    expect(
      (await assetStatusRepository.getAssetStatuses({ tenantId: tenantA, query: 'ACT' })).data.map(
        (s) => s.name
      )
    ).toEqual(['Active']);
  });

  it('should paginate list results and return total', async () => {
    await createStatus(tenantA, 'Alpha', 'A');
    await createStatus(tenantA, 'Bravo', 'B');
    await createStatus(tenantA, 'Charlie', 'C');
    const result = await assetStatusRepository.getAssetStatuses({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((status) => status.name)).toEqual(['Charlie']);
  });
});
