import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteTypeRepository } from '../repository/clinical-note-type-repository';
import { validateCreateClinicalNoteType } from './create-clinical-note-type-validator';
import { validateDeleteClinicalNoteType } from './delete-clinical-note-type-validator';
import { validateGetClinicalNoteTypeById } from './get-clinical-note-type-by-id-validator';
import { validateGetClinicalNoteTypes } from './get-clinical-note-types-validator';
import { validateUpdateClinicalNoteType } from './update-clinical-note-type-validator';

vi.mock('../repository/clinical-note-type-repository', () => ({
  clinicalNoteTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getClinicalNoteTypeById: vi.fn(),
  },
}));

const repo = clinicalNoteTypeRepository as typeof clinicalNoteTypeRepository & {
  findActiveByName: Mock<typeof clinicalNoteTypeRepository.findActiveByName>;
  findActiveByCode: Mock<typeof clinicalNoteTypeRepository.findActiveByCode>;
  getClinicalNoteTypeById: Mock<typeof clinicalNoteTypeRepository.getClinicalNoteTypeById>;
};
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Progress Note',
  code: 'PROG',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('ClinicalNoteType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getClinicalNoteTypeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateClinicalNoteType({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Clinical note type name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateClinicalNoteType({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active clinical note type name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateClinicalNoteType(
      { name: 'Progress Note', code: 'PROG' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Clinical note type name 'Progress Note' already exists."],
    });
  });

  it('should return conflict when active clinical note type code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateClinicalNoteType(
      { name: 'Progress Note', code: 'PROG' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Clinical note type code 'PROG' already exists."],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateClinicalNoteType('7', { name: 'Consultation', code: 'cons' }, 'tenant-1');
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Consultation', {
      excludeId: 7,
    });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'CONS', { excludeId: 7 });
  });

  it('should return invalid id message and not-found according to validator behavior', async () => {
    expect(validateGetClinicalNoteTypeById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Clinical note type abc is Invalid.'],
    });
    repo.getClinicalNoteTypeById.mockResolvedValue(undefined);
    await expect(
      validateUpdateClinicalNoteType('1', { name: 'Consultation', code: 'CONS' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateClinicalNoteType({ name: ' Consultation ', code: 'cons' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Consultation', code: 'CONS' } });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteClinicalNoteType('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetClinicalNoteTypes('  ')).toMatchObject({ success: false });
  });
});
