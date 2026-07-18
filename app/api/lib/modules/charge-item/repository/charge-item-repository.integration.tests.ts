import { describe, expect, it } from 'vitest';

import type { ChargeItemCategory } from '../schemas/charge-item-schema';
import { chargeItemRepository } from './charge-item-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createChargeItem = (
  tenantId: string,
  name: string,
  code: string,
  overrides: Partial<{ category: ChargeItemCategory; unitPrice: number; isActive: boolean }> = {}
) =>
  chargeItemRepository.createChargeItem({
    tenantId,
    name,
    code,
    category: overrides.category ?? 'CONSULTATION',
    unitPrice: overrides.unitPrice ?? 500,
    description: `${name} desc`,
    isActive: overrides.isActive ?? true,
  });

describe('ChargeItem repository', () => {
  it('should create and read back a charge item', async () => {
    const created = await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(
      chargeItemRepository.getChargeItemById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      name: 'General Consultation',
      code: 'CONS',
      category: 'CONSULTATION',
      unitPrice: 500,
      isActive: true,
      tenantId: tenantA,
    });
  });

  it('should not get a row created by another tenant', async () => {
    const created = await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(
      chargeItemRepository.getChargeItemById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted rows from reads', async () => {
    const created = await createChargeItem(tenantA, 'Dressing', 'DRSG');

    await chargeItemRepository.deleteChargeItem(created.id, tenantA);

    await expect(
      chargeItemRepository.getChargeItemById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should not soft-delete a row belonging to another tenant', async () => {
    const created = await createChargeItem(tenantA, 'Dressing', 'DRSG');

    await expect(
      chargeItemRepository.deleteChargeItem(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      chargeItemRepository.getChargeItemById(created.id, tenantA)
    ).resolves.toBeDefined();
  });

  it('should update a charge item within the tenant', async () => {
    const created = await createChargeItem(tenantA, 'Dressing', 'DRSG');

    const updated = await chargeItemRepository.updateChargeItem(created.id, {
      tenantId: tenantA,
      name: 'Wound Dressing',
      code: 'WDRS',
      category: 'PROCEDURE',
      unitPrice: 250.5,
      description: undefined,
      isActive: false,
    });

    expect(updated).toMatchObject({
      name: 'Wound Dressing',
      code: 'WDRS',
      category: 'PROCEDURE',
      unitPrice: 250.5,
      isActive: false,
      description: null,
    });
  });

  it('should reject a duplicate name within a tenant case-insensitively', async () => {
    await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(createChargeItem(tenantA, 'general consultation', 'CONS2')).rejects.toThrow();
  });

  it('should reject a duplicate code within a tenant case-insensitively', async () => {
    await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(createChargeItem(tenantA, 'Another Name', 'cons')).rejects.toThrow();
  });

  it('should reject a negative unit price via the check constraint', async () => {
    await expect(
      createChargeItem(tenantA, 'Bad Price', 'BAD', { unitPrice: -1 })
    ).rejects.toThrow();
  });

  it('should allow the same name and code in a different tenant', async () => {
    await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(createChargeItem(tenantB, 'General Consultation', 'CONS')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing the name of a soft-deleted charge item', async () => {
    const created = await createChargeItem(tenantA, 'General Consultation', 'CONS');
    await chargeItemRepository.deleteChargeItem(created.id, tenantA);

    await expect(createChargeItem(tenantA, 'General Consultation', 'CONS')).resolves.toMatchObject({
      name: 'General Consultation',
    });
  });

  it('should find an active charge item by name and code case-insensitively', async () => {
    await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(
      chargeItemRepository.findActiveByName(tenantA, 'general consultation')
    ).resolves.toMatchObject({ code: 'CONS' });
    await expect(chargeItemRepository.findActiveByCode(tenantA, 'cons')).resolves.toMatchObject({
      name: 'General Consultation',
    });
    await expect(
      chargeItemRepository.findActiveByName(tenantB, 'general consultation')
    ).resolves.toBeUndefined();
  });

  it('should exclude the given id from the uniqueness lookups', async () => {
    const created = await createChargeItem(tenantA, 'General Consultation', 'CONS');

    await expect(
      chargeItemRepository.findActiveByName(tenantA, 'General Consultation', {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
    await expect(
      chargeItemRepository.findActiveByCode(tenantA, 'CONS', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should list only the tenant rows ordered by name with pagination', async () => {
    await createChargeItem(tenantA, 'Vaccination', 'VAC');
    await createChargeItem(tenantA, 'Dressing', 'DRSG');
    await createChargeItem(tenantA, 'Consultation', 'CONS');
    await createChargeItem(tenantB, 'Other Tenant', 'OTH');

    const firstPage = await chargeItemRepository.getChargeItems({
      tenantId: tenantA,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.data.map((row) => row.name)).toEqual(['Consultation', 'Dressing']);

    const secondPage = await chargeItemRepository.getChargeItems({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });

    expect(secondPage.data.map((row) => row.name)).toEqual(['Vaccination']);
  });

  it('should filter the list by category', async () => {
    await createChargeItem(tenantA, 'Consultation', 'CONS', { category: 'CONSULTATION' });
    await createChargeItem(tenantA, 'X-Ray', 'XRAY', { category: 'INVESTIGATION' });

    const result = await chargeItemRepository.getChargeItems({
      tenantId: tenantA,
      category: 'INVESTIGATION',
    });

    expect(result.data.map((row) => row.code)).toEqual(['XRAY']);
  });

  it('should filter the list by active flag', async () => {
    await createChargeItem(tenantA, 'Active Item', 'ACT', { isActive: true });
    await createChargeItem(tenantA, 'Retired Item', 'RET', { isActive: false });

    const activeOnly = await chargeItemRepository.getChargeItems({
      tenantId: tenantA,
      isActive: true,
    });

    expect(activeOnly.data.map((row) => row.code)).toEqual(['ACT']);
  });

  it('should search by name and code', async () => {
    await createChargeItem(tenantA, 'General Consultation', 'CONS');
    await createChargeItem(tenantA, 'Vaccination', 'VAC');

    const byName = await chargeItemRepository.getChargeItems({ tenantId: tenantA, query: 'vacc' });
    expect(byName.data.map((row) => row.code)).toEqual(['VAC']);

    const byCode = await chargeItemRepository.getChargeItems({ tenantId: tenantA, query: 'cons' });
    expect(byCode.data.map((row) => row.code)).toEqual(['CONS']);
  });

  it('should exclude soft-deleted rows from the list', async () => {
    const created = await createChargeItem(tenantA, 'General Consultation', 'CONS');
    await createChargeItem(tenantA, 'Dressing', 'DRSG');
    await chargeItemRepository.deleteChargeItem(created.id, tenantA);

    const result = await chargeItemRepository.getChargeItems({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data.map((row) => row.code)).toEqual(['DRSG']);
  });
});
