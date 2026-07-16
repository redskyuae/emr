import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { allergenRepository } from '../repository/allergen-repository';
import { validateCreateAllergen } from './create-allergen-validator';
import { validateDeleteAllergen } from './delete-allergen-validator';
import { validateGetAllergenById } from './get-allergen-by-id-validator';
import { validateGetAllergens } from './get-allergens-validator';
import { validateUpdateAllergen } from './update-allergen-validator';

vi.mock('../repository/allergen-repository', () => ({
  allergenRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAllergenById: vi.fn(),
  },
}));

const repo = allergenRepository as typeof allergenRepository & {
  findActiveByName: Mock<typeof allergenRepository.findActiveByName>;
  findActiveByCode: Mock<typeof allergenRepository.findActiveByCode>;
  getAllergenById: Mock<typeof allergenRepository.getAllergenById>;
};
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Penicillin',
  code: 'PEN',
  category: 'drug' as const,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Allergen validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAllergenById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAllergen({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Allergen name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAllergen({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active allergen name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAllergen(
      { name: 'Penicillin', code: 'PEN', category: 'drug' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Allergen name 'Penicillin' already exists."],
    });
  });

  it('should return conflict when active allergen code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAllergen(
      { name: 'Penicillin', code: 'PEN', category: 'drug' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Allergen code 'PEN' already exists."],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAllergen(
      '7',
      { name: 'Aspirin', code: 'asp', category: 'drug' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Aspirin', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'ASP', { excludeId: 7 });
  });

  it('should return invalid id message and not-found according to validator behavior', async () => {
    expect(validateGetAllergenById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Allergen abc is Invalid.'],
    });
    repo.getAllergenById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAllergen('1', { name: 'Aspirin', code: 'ASP', category: 'drug' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAllergen({ name: ' Aspirin ', code: 'asp', category: 'drug' }, 'tenant-1')
    ).resolves.toEqual({
      success: true,
      data: { name: 'Aspirin', code: 'ASP', category: 'drug' },
    });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAllergen('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAllergens('  ')).toMatchObject({ success: false });
  });
});
