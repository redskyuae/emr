import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import { validateCreateClinicalNoteType } from '../validator/create-clinical-note-type-validator';
import { validateDeleteClinicalNoteType } from '../validator/delete-clinical-note-type-validator';
import { validateUpdateClinicalNoteType } from '../validator/update-clinical-note-type-validator';
import { createClinicalNoteTypeCommand } from './create-clinical-note-type-command';
import { deleteClinicalNoteTypeCommand } from './delete-clinical-note-type-command';
import { updateClinicalNoteTypeCommand } from './update-clinical-note-type-command';

vi.mock('../repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: {
    createClinicalNoteType: vi.fn(),
    updateClinicalNoteType: vi.fn(),
    deleteClinicalNoteType: vi.fn(),
  },
}));
vi.mock('../validator/create-clinical-note-type-validator', () => ({
  validateCreateClinicalNoteType: vi.fn(),
}));
vi.mock('../validator/update-clinical-note-type-validator', () => ({
  validateUpdateClinicalNoteType: vi.fn(),
}));
vi.mock('../validator/delete-clinical-note-type-validator', () => ({
  validateDeleteClinicalNoteType: vi.fn(),
}));

const repo = clinicalNoteTypeRepository as typeof clinicalNoteTypeRepository & {
  createClinicalNoteType: Mock<typeof clinicalNoteTypeRepository.createClinicalNoteType>;
  updateClinicalNoteType: Mock<typeof clinicalNoteTypeRepository.updateClinicalNoteType>;
  deleteClinicalNoteType: Mock<typeof clinicalNoteTypeRepository.deleteClinicalNoteType>;
};
const validateCreate = validateCreateClinicalNoteType as Mock<
  typeof validateCreateClinicalNoteType
>;
const validateUpdate = validateUpdateClinicalNoteType as Mock<
  typeof validateUpdateClinicalNoteType
>;
const validateDelete = validateDeleteClinicalNoteType as Mock<
  typeof validateDeleteClinicalNoteType
>;
const clinicalNoteType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Progress Note',
  code: 'PROG',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('ClinicalNoteType commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Progress Note', code: 'PROG', description: undefined },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { name: 'Progress Note', code: 'PROG', description: undefined } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createClinicalNoteType.mockResolvedValue(clinicalNoteType);
    repo.updateClinicalNoteType.mockResolvedValue(clinicalNoteType);
    repo.deleteClinicalNoteType.mockResolvedValue(clinicalNoteType);
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createClinicalNoteTypeCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createClinicalNoteType).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on success', async () => {
    await createClinicalNoteTypeCommand({}, 'tenant-1');
    expect(repo.createClinicalNoteType).toHaveBeenCalledWith({
      name: 'Progress Note',
      code: 'PROG',
      description: undefined,
      tenantId: 'tenant-1',
    });
  });

  it('should return created/updated/deleted data on repository success', async () => {
    await expect(createClinicalNoteTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: clinicalNoteType,
    });
    await expect(updateClinicalNoteTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: clinicalNoteType,
    });
    await expect(deleteClinicalNoteTypeCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: clinicalNoteType,
    });
  });

  it('should map known Postgres unique constraint 23505 for name index to conflict error', async () => {
    repo.createClinicalNoteType.mockRejectedValue({
      cause: { code: '23505', constraint: 'clinical_note_type_tenant_name_idx' },
    });
    await expect(createClinicalNoteTypeCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Clinical note type name 'Progress Note' already exists."],
    });
  });

  it('should map known Postgres unique constraint 23505 for code index to conflict error', async () => {
    repo.updateClinicalNoteType.mockRejectedValue({
      cause: { code: '23505', constraint: 'clinical_note_type_tenant_code_idx' },
    });
    await expect(updateClinicalNoteTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Clinical note type code 'PROG' already exists."],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.createClinicalNoteType.mockRejectedValue(error);
    await expect(createClinicalNoteTypeCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should preserve validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateClinicalNoteTypeCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
  });
});
