import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { treatmentRepository } from '../repository/treatment-repository';
import { validateCreateTreatment } from '../validator/create-treatment-validator';
import { validateDeleteTreatment } from '../validator/delete-treatment-validator';
import { validateUpdateTreatment } from '../validator/update-treatment-validator';
import { createTreatmentCommand } from './create-treatment-command';
import { deleteTreatmentCommand } from './delete-treatment-command';
import { updateTreatmentCommand } from './update-treatment-command';

vi.mock('../repository/treatment-repository', () => ({
  treatmentRepository: {
    createTreatment: vi.fn(),
    updateTreatment: vi.fn(),
    deleteTreatment: vi.fn(),
  },
}));
vi.mock('../validator/create-treatment-validator', () => ({
  validateCreateTreatment: vi.fn(),
}));
vi.mock('../validator/update-treatment-validator', () => ({
  validateUpdateTreatment: vi.fn(),
}));
vi.mock('../validator/delete-treatment-validator', () => ({
  validateDeleteTreatment: vi.fn(),
}));

const repo = vi.mocked(treatmentRepository);
const validateCreate = vi.mocked(validateCreateTreatment);
const validateUpdate = vi.mocked(validateUpdateTreatment);
const validateDelete = vi.mocked(validateDeleteTreatment);

const payload = {
  name: 'Abhyanga wellness programme',
  code: 'TRT-0400',
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  description: undefined,
  roomType: undefined,
  therapistSkill: undefined,
  sessions: [
    {
      label: 'Session 1 of 6 · Abhyanga + Swedana',
      procedure: 'Abhyanga + Swedana',
      sessionNumber: 1,
      durationMinutes: 60,
      setupMinutes: 10,
      cleaningMinutes: 5,
    },
  ],
};

const treatment = {
  id: 1,
  tenantId: 'tenant-1',
  name: payload.name,
  code: payload.code,
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

describe('Treatment commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: {
          name: payload.name,
          code: payload.code,
          durationMinutes: payload.durationMinutes,
          setupMinutes: payload.setupMinutes,
          cleaningMinutes: payload.cleaningMinutes,
          description: payload.description,
          roomType: payload.roomType,
          therapistSkill: payload.therapistSkill,
        },
      },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createTreatment.mockResolvedValue(treatment);
    repo.updateTreatment.mockResolvedValue(treatment);
    repo.deleteTreatment.mockResolvedValue(treatment);
  });

  describe('createTreatmentCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

      const result = await createTreatmentCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
      expect(repo.createTreatment).not.toHaveBeenCalled();
    });

    it('should write the validated payload with the session tenant id', async () => {
      await createTreatmentCommand(payload, 'tenant-1');

      expect(repo.createTreatment).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
    });

    it('should return the created treatment on success', async () => {
      await expect(createTreatmentCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: treatment,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.createTreatment.mockRejectedValue({
        cause: { code: '23505', constraint: 'treatment_tenant_name_idx' },
      });

      await expect(createTreatmentCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Treatment name 'Abhyanga wellness programme' already exists."],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.createTreatment.mockRejectedValue(error);

      await expect(createTreatmentCommand({}, 'tenant-1')).rejects.toThrow(error);
    });
  });

  describe('updateTreatmentCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

      const result = await updateTreatmentCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false, errors: ['Invalid'] });
      expect(repo.updateTreatment).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateTreatment.mockResolvedValue(undefined);

      await expect(updateTreatmentCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map a known Postgres 23505 to a conflict error', async () => {
      repo.updateTreatment.mockRejectedValue({
        cause: { code: '23505', constraint: 'treatment_tenant_code_idx' },
      });

      await expect(updateTreatmentCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Treatment code 'TRT-0400' already exists."],
      });
    });

    it('should return the updated treatment on success', async () => {
      await expect(updateTreatmentCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: treatment,
      });
    });
  });

  describe('deleteTreatmentCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Treatment abc is Invalid.'] });

      const result = await deleteTreatmentCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Treatment abc is Invalid.'] });
      expect(repo.deleteTreatment).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteTreatment.mockResolvedValue(undefined);

      await expect(deleteTreatmentCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted treatment on success', async () => {
      await expect(deleteTreatmentCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: treatment,
      });
      expect(repo.deleteTreatment).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
