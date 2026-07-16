import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import { validateGetClinicalNoteTypeById } from '../validator/get-clinical-note-type-by-id-validator';
import { validateGetClinicalNoteTypes } from '../validator/get-clinical-note-types-validator';
import { getClinicalNoteTypeByIdQuery } from './get-clinical-note-type-by-id-query';
import { getClinicalNoteTypesQuery } from './get-clinical-note-types-query';

vi.mock('../repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: {
    getClinicalNoteTypeById: vi.fn(),
    getClinicalNoteTypes: vi.fn(),
  },
}));
vi.mock('../validator/get-clinical-note-type-by-id-validator', () => ({
  validateGetClinicalNoteTypeById: vi.fn(),
}));
vi.mock('../validator/get-clinical-note-types-validator', () => ({
  validateGetClinicalNoteTypes: vi.fn(),
}));

const repo = clinicalNoteTypeRepository as typeof clinicalNoteTypeRepository & {
  getClinicalNoteTypeById: Mock<typeof clinicalNoteTypeRepository.getClinicalNoteTypeById>;
  getClinicalNoteTypes: Mock<typeof clinicalNoteTypeRepository.getClinicalNoteTypes>;
};
const validateById = validateGetClinicalNoteTypeById as Mock<
  typeof validateGetClinicalNoteTypeById
>;
const validateList = validateGetClinicalNoteTypes as Mock<typeof validateGetClinicalNoteTypes>;
const clinicalNoteType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Progress Note',
  code: 'PROG',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('ClinicalNoteType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getClinicalNoteTypeById.mockResolvedValue(clinicalNoteType);
    repo.getClinicalNoteTypes.mockResolvedValue({ data: [clinicalNoteType], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getClinicalNoteTypeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getClinicalNoteTypeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getClinicalNoteTypeByIdQuery('1', 'tenant-1');
    expect(repo.getClinicalNoteTypeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getClinicalNoteTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'prog' });
    expect(repo.getClinicalNoteTypes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'prog',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getClinicalNoteTypesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [clinicalNoteType],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getClinicalNoteTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: clinicalNoteType,
    });
  });

  it('should return not-found status when clinical note type is missing', async () => {
    repo.getClinicalNoteTypeById.mockResolvedValue(undefined);
    const result = await getClinicalNoteTypeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
