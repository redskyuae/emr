import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { allergenRepository } from '../repository/allergen-repository';
import { validateGetAllergenById } from '../validator/get-allergen-by-id-validator';
import { validateGetAllergens } from '../validator/get-allergens-validator';
import { getAllergenByIdQuery } from './get-allergen-by-id-query';
import { getAllergensQuery } from './get-allergens-query';

vi.mock('../repository/allergen-repository', () => ({
  allergenRepository: {
    getAllergenById: vi.fn(),
    getAllergens: vi.fn(),
  },
}));
vi.mock('../validator/get-allergen-by-id-validator', () => ({
  validateGetAllergenById: vi.fn(),
}));
vi.mock('../validator/get-allergens-validator', () => ({
  validateGetAllergens: vi.fn(),
}));

const repo = allergenRepository as typeof allergenRepository & {
  getAllergenById: Mock<typeof allergenRepository.getAllergenById>;
  getAllergens: Mock<typeof allergenRepository.getAllergens>;
};
const validateById = validateGetAllergenById as Mock<typeof validateGetAllergenById>;
const validateList = validateGetAllergens as Mock<typeof validateGetAllergens>;
const allergen = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Penicillin',
  code: 'PEN',
  category: 'drug' as const,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Allergen queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAllergenById.mockResolvedValue(allergen);
    repo.getAllergens.mockResolvedValue({ data: [allergen], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAllergenByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAllergenById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAllergenByIdQuery('1', 'tenant-1');
    expect(repo.getAllergenById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAllergensQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'pen' });
    expect(repo.getAllergens).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'pen',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAllergensQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [allergen],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAllergenByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: allergen,
    });
  });

  it('should return not-found status when allergen is missing', async () => {
    repo.getAllergenById.mockResolvedValue(undefined);
    const result = await getAllergenByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
