import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type BedBoardRow, bedRepository } from '../repository/bed-repository';
import type { Bed } from '../schemas/bed-schema';
import { validateGetBedById } from '../validator/get-bed-by-id-validator';
import { getBedBoardQuery } from './get-bed-board-query';
import { getBedByIdQuery } from './get-bed-by-id-query';
import { getBedsQuery } from './get-beds-query';

vi.mock('../repository/bed-repository', () => ({
  bedRepository: {
    getBeds: vi.fn(),
    getBedById: vi.fn(),
    getBedBoard: vi.fn(),
  },
}));
vi.mock('../validator/get-bed-by-id-validator', () => ({
  validateGetBedById: vi.fn(),
}));

const repo = vi.mocked(bedRepository);
const validateById = vi.mocked(validateGetBedById);

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

const freeBoardRow: BedBoardRow = {
  bedId: 9,
  wardId: 3,
  mrn: null,
  wardName: 'ICU',
  wardCode: 'ICU',
  patientId: null,
  lastName: null,
  firstName: null,
  roomNumber: null,
  admissionId: null,
  bedNumber: 'ICU-01',
  status: 'AVAILABLE',
  admissionNumber: null,
};

const occupiedBoardRow: BedBoardRow = {
  ...freeBoardRow,
  bedId: 10,
  mrn: 'MRN-1001',
  patientId: 21,
  admissionId: 5,
  lastName: 'Kumar',
  firstName: 'Priya',
  status: 'OCCUPIED',
  bedNumber: 'ICU-02',
  admissionNumber: 'ADM-1001',
};

describe('Bed queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 9, tenantId: 'tenant-1' } });
    repo.getBedById.mockResolvedValue(bed);
    repo.getBeds.mockResolvedValue({ data: [bed], total: 1 });
    repo.getBedBoard.mockResolvedValue([freeBoardRow, occupiedBoardRow]);
  });

  describe('getBedByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Bed abc is Invalid.'] });

      await expect(getBedByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Bed abc is Invalid.'],
      });
      expect(repo.getBedById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getBedById.mockResolvedValue(undefined);

      await expect(getBedByIdQuery('9', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the bed on success', async () => {
      await expect(getBedByIdQuery('9', 'tenant-1')).resolves.toEqual({
        success: true,
        data: bed,
      });
    });
  });

  describe('getBedsQuery', () => {
    it('should reject a blank tenant id without calling the repository', async () => {
      await expect(getBedsQuery({ tenantId: '  ' })).resolves.toMatchObject({ success: false });
      expect(repo.getBeds).not.toHaveBeenCalled();
    });

    it('should pass filters through to the repository', async () => {
      await getBedsQuery({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        wardId: 3,
        status: 'RESERVED',
        query: 'icu',
      });

      expect(repo.getBeds).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        wardId: 3,
        status: 'RESERVED',
        query: 'icu',
      });
    });

    it('should return the rows and total on success', async () => {
      await expect(getBedsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [bed],
        total: 1,
      });
    });
  });

  describe('getBedBoardQuery', () => {
    it('should reject a blank tenant id without calling the repository', async () => {
      await expect(getBedBoardQuery('  ')).resolves.toMatchObject({ success: false });
      expect(repo.getBedBoard).not.toHaveBeenCalled();
    });

    it('should group beds by ward with occupants resolved', async () => {
      await expect(getBedBoardQuery('tenant-1')).resolves.toEqual({
        success: true,
        data: [
          {
            wardId: 3,
            wardName: 'ICU',
            wardCode: 'ICU',
            beds: [
              {
                id: 9,
                bedNumber: 'ICU-01',
                status: 'AVAILABLE',
                roomNumber: null,
                occupant: null,
              },
              {
                id: 10,
                bedNumber: 'ICU-02',
                status: 'OCCUPIED',
                roomNumber: null,
                occupant: {
                  mrn: 'MRN-1001',
                  patientId: 21,
                  lastName: 'Kumar',
                  firstName: 'Priya',
                  admissionId: 5,
                  admissionNumber: 'ADM-1001',
                },
              },
            ],
          },
        ],
      });
    });

    it('should keep wards separate when beds span multiple wards', async () => {
      repo.getBedBoard.mockResolvedValue([
        freeBoardRow,
        { ...freeBoardRow, bedId: 11, wardId: 4, wardName: 'Maternity', wardCode: 'MAT' },
      ]);

      const result = await getBedBoardQuery('tenant-1');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.map((wardEntry) => wardEntry.wardName)).toEqual(['ICU', 'Maternity']);
      }
    });
  });
});
