import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { allergenRepository } from '../repository/allergen-repository';
import { validateCreateAllergen } from '../validator/create-allergen-validator';
import { validateDeleteAllergen } from '../validator/delete-allergen-validator';
import { validateUpdateAllergen } from '../validator/update-allergen-validator';
import { createAllergenCommand } from './create-allergen-command';
import { deleteAllergenCommand } from './delete-allergen-command';
import { updateAllergenCommand } from './update-allergen-command';

vi.mock('../repository/allergen-repository', () => ({
  allergenRepository: {
    createAllergen: vi.fn(),
    updateAllergen: vi.fn(),
    deleteAllergen: vi.fn(),
  },
}));
vi.mock('../validator/create-allergen-validator', () => ({
  validateCreateAllergen: vi.fn(),
}));
vi.mock('../validator/update-allergen-validator', () => ({
  validateUpdateAllergen: vi.fn(),
}));
vi.mock('../validator/delete-allergen-validator', () => ({
  validateDeleteAllergen: vi.fn(),
}));

const repo = allergenRepository as typeof allergenRepository & {
  createAllergen: Mock<typeof allergenRepository.createAllergen>;
  updateAllergen: Mock<typeof allergenRepository.updateAllergen>;
  deleteAllergen: Mock<typeof allergenRepository.deleteAllergen>;
};
const validateCreate = validateCreateAllergen as Mock<typeof validateCreateAllergen>;
const validateUpdate = validateUpdateAllergen as Mock<typeof validateUpdateAllergen>;
const validateDelete = validateDeleteAllergen as Mock<typeof validateDeleteAllergen>;
const allergen = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Penicillin',
  code: 'PEN',
  category: 'drug' as const,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Allergen commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Penicillin', code: 'PEN', category: 'drug' },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { name: 'Penicillin', code: 'PEN', category: 'drug' } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createAllergen.mockResolvedValue(allergen);
    repo.updateAllergen.mockResolvedValue(allergen);
    repo.deleteAllergen.mockResolvedValue(allergen);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createAllergenCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createAllergen).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createAllergenCommand({}, 'tenant-1');
    expect(repo.createAllergen).toHaveBeenCalledWith({
      name: 'Penicillin',
      code: 'PEN',
      category: 'drug',
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createAllergenCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: allergen,
    });
    await expect(updateAllergenCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: allergen,
    });
    await expect(deleteAllergenCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: allergen,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createAllergen.mockRejectedValue({
      cause: { code: '23505', constraint: 'allergen_tenant_name_idx' },
    });
    await expect(createAllergenCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Allergen name 'Penicillin' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateAllergen.mockRejectedValue({
      cause: { code: '23505', constraint: 'allergen_tenant_code_idx' },
    });
    await expect(updateAllergenCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Allergen code 'PEN' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createAllergen.mockRejectedValue(error);
    await expect(createAllergenCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateAllergenCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
