import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { validateCreateBed } from '../validator/create-bed-validator';
import { validateDeleteBed } from '../validator/delete-bed-validator';
import { validateUpdateBed } from '../validator/update-bed-validator';
import { createBedCommand } from './create-bed-command';
import { deleteBedCommand } from './delete-bed-command';
import { updateBedCommand } from './update-bed-command';

vi.mock('../repository/bed-repository', () => ({
  bedRepository: {
    createBed: vi.fn(),
    updateBed: vi.fn(),
    deleteBed: vi.fn(),
  },
}));
vi.mock('../validator/create-bed-validator', () => ({
  validateCreateBed: vi.fn(),
}));
vi.mock('../validator/update-bed-validator', () => ({
  validateUpdateBed: vi.fn(),
}));
vi.mock('../validator/delete-bed-validator', () => ({
  validateDeleteBed: vi.fn(),
}));

const repo = vi.mocked(bedRepository);
const validateCreate = vi.mocked(validateCreateBed);
const validateUpdate = vi.mocked(validateUpdateBed);
const validateDelete = vi.mocked(validateDeleteBed);

const bed: Bed = {
  id: 9,
  wardId: 3,
  roomId: null,
  tenantId: 'tenant-1',
  bedNumber: 'ICU-01',
  status: 'AVAILABLE',
  notes: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  ward: { id: 3, name: 'ICU', code: 'ICU' },
  room: null,
};

const input = {
  wardId: 3,
  notes: undefined,
  roomId: undefined,
  bedNumber: 'ICU-01',
  status: 'AVAILABLE' as const,
};

describe('Bed commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: { input, wardName: 'ICU' } });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 9, payload: input, wardName: 'ICU' },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 9, tenantId: 'tenant-1' } });
    repo.createBed.mockResolvedValue(bed);
    repo.updateBed.mockResolvedValue(bed);
    repo.deleteBed.mockResolvedValue({ outcome: 'deleted', data: { id: 9 } });
  });

  describe('createBedCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Ward 3 is Invalid.'] });

      const result = await createBedCommand({}, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Ward 3 is Invalid.'] });
      expect(repo.createBed).not.toHaveBeenCalled();
    });

    it('should create the bed with the tenant id stamped', async () => {
      await expect(createBedCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: bed,
      });
      expect(repo.createBed).toHaveBeenCalledWith({ ...input, tenantId: 'tenant-1' });
    });

    it('should map a 23505 race on the ward bed number index to a clean conflict', async () => {
      repo.createBed.mockRejectedValue(
        Object.assign(new Error('duplicate'), {
          cause: { code: '23505', constraint: 'bed_ward_bed_number_idx' },
        })
      );

      await expect(createBedCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Bed number 'ICU-01' already exists in ward ICU."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      repo.createBed.mockRejectedValue(new Error('boom'));

      await expect(createBedCommand({}, 'tenant-1')).rejects.toThrow('boom');
    });
  });

  describe('updateBedCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({
        success: false,
        errors: ['Bed abc is Invalid.'],
      });

      const result = await updateBedCommand('abc', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Bed abc is Invalid.'] });
      expect(repo.updateBed).not.toHaveBeenCalled();
    });

    it('should return not found when the row vanished after validation', async () => {
      repo.updateBed.mockResolvedValue(undefined);

      await expect(updateBedCommand('9', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the updated bed on success', async () => {
      await expect(updateBedCommand('9', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: bed,
      });
      expect(repo.updateBed).toHaveBeenCalledWith(9, { ...input, tenantId: 'tenant-1' });
    });

    it('should map a 23505 race to a clean conflict on update', async () => {
      repo.updateBed.mockRejectedValue(
        Object.assign(new Error('duplicate'), {
          cause: { code: '23505', constraint: 'bed_ward_bed_number_idx' },
        })
      );

      await expect(updateBedCommand('9', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Bed number 'ICU-01' already exists in ward ICU."],
      });
    });
  });

  describe('deleteBedCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Bed abc is Invalid.'] });

      const result = await deleteBedCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Bed abc is Invalid.'] });
      expect(repo.deleteBed).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteBed.mockResolvedValue({ outcome: 'not-found' });

      await expect(deleteBedCommand('9', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should refuse to delete an occupied bed with the exact message', async () => {
      repo.deleteBed.mockResolvedValue({ outcome: 'occupied', bedNumber: 'ICU-01' });

      await expect(deleteBedCommand('9', 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed ICU-01 cannot be removed while occupied.'],
      });
    });

    it('should return the deleted id on success', async () => {
      await expect(deleteBedCommand('9', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 9 },
      });
      expect(repo.deleteBed).toHaveBeenCalledWith(9, 'tenant-1');
    });
  });
});
