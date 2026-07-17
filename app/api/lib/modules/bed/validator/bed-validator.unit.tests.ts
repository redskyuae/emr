import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roomRepository } from '../../room/repository/room-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import { bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { getBedNumberUniqueConstraintErrors } from './bed-number-validator';
import { validateCreateBed } from './create-bed-validator';
import { validateDeleteBed } from './delete-bed-validator';
import { validateGetBedById } from './get-bed-by-id-validator';
import { validateGetBeds } from './get-beds-validator';
import { validateUpdateBed } from './update-bed-validator';

vi.mock('../repository/bed-repository', () => ({
  bedRepository: {
    getBedById: vi.fn(),
    findActiveByBedNumber: vi.fn(),
  },
}));
vi.mock('../../ward/repository/ward-repository', () => ({
  wardRepository: { getWardById: vi.fn() },
}));
vi.mock('../../room/repository/room-repository', () => ({
  roomRepository: { getRoomById: vi.fn() },
}));

const repo = vi.mocked(bedRepository);
const wardRepo = vi.mocked(wardRepository);
const roomRepo = vi.mocked(roomRepository);

const ward = {
  id: 3,
  tenantId: 'tenant-1',
  name: 'ICU',
  code: 'ICU',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const existingBed: Bed = {
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

describe('Bed validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wardRepo.getWardById.mockResolvedValue(ward);
    repo.getBedById.mockResolvedValue(existingBed);
    repo.findActiveByBedNumber.mockResolvedValue(undefined);
  });

  describe('validateCreateBed', () => {
    it('should not call the repositories when schema parsing fails', async () => {
      const result = await validateCreateBed({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(wardRepo.getWardById).not.toHaveBeenCalled();
      expect(repo.findActiveByBedNumber).not.toHaveBeenCalled();
    });

    it('should return conflict when the ward does not exist', async () => {
      wardRepo.getWardById.mockResolvedValue(undefined);

      const result = await validateCreateBed({ bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Ward 3 is Invalid.'],
      });
      expect(repo.findActiveByBedNumber).not.toHaveBeenCalled();
    });

    it('should return conflict when the linked room does not exist', async () => {
      roomRepo.getRoomById.mockResolvedValue(undefined);

      const result = await validateCreateBed(
        { bedNumber: 'ICU-01', wardId: 3, roomId: 12 },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Room 12 is Invalid.'],
      });
    });

    it('should not look up the room when no room id is supplied', async () => {
      await validateCreateBed({ bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(roomRepo.getRoomById).not.toHaveBeenCalled();
    });

    it('should return conflict with the ward name when the bed number already exists', async () => {
      repo.findActiveByBedNumber.mockResolvedValue({ id: 8, bedNumber: 'ICU-01' });

      const result = await validateCreateBed({ bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Bed number 'ICU-01' already exists in ward ICU."],
      });
    });

    it('should return the parsed input and ward name on success', async () => {
      const result = await validateCreateBed({ bedNumber: ' ICU-01 ', wardId: '3' }, 'tenant-1');

      expect(result).toEqual({
        success: true,
        data: {
          wardName: 'ICU',
          input: {
            wardId: 3,
            notes: undefined,
            roomId: undefined,
            bedNumber: 'ICU-01',
            status: 'AVAILABLE',
          },
        },
      });
      expect(repo.findActiveByBedNumber).toHaveBeenCalledWith('tenant-1', 3, 'ICU-01', {});
    });
  });

  describe('validateUpdateBed', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateBed('abc', { bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Bed abc is Invalid.'] });
      expect(repo.getBedById).not.toHaveBeenCalled();
    });

    it('should return not found when the bed does not exist', async () => {
      repo.getBedById.mockResolvedValue(undefined);

      const result = await validateUpdateBed('9', { bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should refuse to update an occupied bed', async () => {
      repo.getBedById.mockResolvedValue({ ...existingBed, status: 'OCCUPIED' });

      const result = await validateUpdateBed('9', { bedNumber: 'ICU-01', wardId: 3 }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed ICU-01 is occupied and its status is managed by admissions.'],
      });
      expect(wardRepo.getWardById).not.toHaveBeenCalled();
    });

    it('should pass excludeId to the uniqueness check and succeed', async () => {
      const result = await validateUpdateBed(
        '9',
        { bedNumber: 'ICU-02', wardId: 3, status: 'RESERVED' },
        'tenant-1'
      );

      expect(repo.findActiveByBedNumber).toHaveBeenCalledWith('tenant-1', 3, 'ICU-02', {
        excludeId: 9,
      });
      expect(result).toEqual({
        success: true,
        data: {
          id: 9,
          wardName: 'ICU',
          payload: {
            wardId: 3,
            notes: undefined,
            roomId: undefined,
            bedNumber: 'ICU-02',
            status: 'RESERVED',
          },
        },
      });
    });
  });

  describe('validateDeleteBed', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteBed('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Bed abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteBed('9', 'tenant-1')).toEqual({
        success: true,
        data: { id: 9, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetBedById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetBedById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Bed abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetBedById('9', 'tenant-1')).toEqual({
        success: true,
        data: { id: 9, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetBeds', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetBeds('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetBeds(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getBedNumberUniqueConstraintErrors', () => {
    it('should map the ward bed number constraint to the duplicate error', () => {
      expect(
        getBedNumberUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'bed_ward_bed_number_idx' } },
          { bedNumber: 'ICU-01', wardName: 'ICU' }
        )
      ).toEqual(["Bed number 'ICU-01' already exists in ward ICU."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getBedNumberUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { bedNumber: 'ICU-01', wardName: 'ICU' }
        )
      ).toEqual([]);
    });
  });
});
