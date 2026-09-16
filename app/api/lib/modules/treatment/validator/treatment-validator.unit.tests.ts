import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { treatmentRepository } from '../repository/treatment-repository';
import { validateCreateTreatment } from './create-treatment-validator';
import { validateDeleteTreatment } from './delete-treatment-validator';
import { validateGetTreatmentById } from './get-treatment-by-id-validator';
import { validateGetTreatments } from './get-treatments-validator';
import { validateUpdateTreatment } from './update-treatment-validator';
import { getTreatmentUniqueConstraintErrors } from './treatment-uniqueness-validator';

vi.mock('../repository/treatment-repository', () => ({
  treatmentRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getTreatmentById: vi.fn(),
  },
}));

const repo = vi.mocked(treatmentRepository);
const session = {
  label: 'Session 1 of 6 · Abhyanga + Swedana',
  procedure: 'Abhyanga + Swedana',
  sessionNumber: 1,
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
};
const payload = {
  name: 'Abhyanga wellness programme',
  code: 'TRT-0400',
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  sessions: [session],
};
const updatePayload = {
  name: 'Abhyanga wellness programme',
  code: 'TRT-0400',
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
};
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Abhyanga wellness programme',
  code: 'TRT-0400',
  description: null,
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  roomType: null,
  therapistSkill: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  sessions: [],
};

describe('Treatment validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getTreatmentById.mockResolvedValue(existing);
  });

  describe('validateCreateTreatment', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateTreatment({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the treatment is unique', async () => {
      const result = await validateCreateTreatment(
        { ...payload, name: ' Abhyanga wellness programme ', code: 'trt-0400' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: true,
        data: { name: 'Abhyanga wellness programme', code: 'TRT-0400' },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateTreatment(payload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Treatment name 'Abhyanga wellness programme' already exists."],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateTreatment(
        { ...payload, name: 'Shirodhara relaxation programme' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Treatment code 'TRT-0400' already exists."],
      });
    });
  });

  describe('validateUpdateTreatment', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateTreatment('abc', updatePayload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Treatment abc is Invalid.'],
      });
      expect(repo.getTreatmentById).not.toHaveBeenCalled();
    });

    it('should return not found when the treatment does not exist', async () => {
      repo.getTreatmentById.mockResolvedValue(undefined);

      const result = await validateUpdateTreatment('1', updatePayload, 'tenant-1');

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateTreatment('7', updatePayload, 'tenant-1');

      expect(repo.findActiveByName).toHaveBeenCalledWith(
        'tenant-1',
        'Abhyanga wellness programme',
        {
          excludeId: 7,
        }
      );
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'TRT-0400', { excludeId: 7 });
    });
  });

  describe('validateDeleteTreatment', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteTreatment('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Treatment abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteTreatment('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetTreatmentById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetTreatmentById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Treatment abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetTreatmentById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetTreatments', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetTreatments('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetTreatments(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getTreatmentUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getTreatmentUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'treatment_tenant_name_idx' } },
          { name: 'Abhyanga wellness programme', code: 'TRT-0400' }
        )
      ).toEqual(["Treatment name 'Abhyanga wellness programme' already exists."]);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getTreatmentUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'treatment_tenant_code_idx' } },
          { name: 'Abhyanga wellness programme', code: 'TRT-0400' }
        )
      ).toEqual(["Treatment code 'TRT-0400' already exists."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getTreatmentUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'Abhyanga wellness programme', code: 'TRT-0400' }
        )
      ).toEqual([]);
    });
  });
});
