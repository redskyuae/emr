import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateAdmitPatient } from '../validator/admit-patient-validator';
import { validateCancelAdmission } from '../validator/cancel-admission-validator';
import { validateDischargeAdmission } from '../validator/discharge-admission-validator';
import { validateGetAdmissionById } from '../validator/get-admission-by-id-validator';
import { validateTransferBed } from '../validator/transfer-bed-validator';
import { validateUpdateAdmission } from '../validator/update-admission-validator';
import { admitPatientCommand } from './admit-patient-command';
import { cancelAdmissionCommand } from './cancel-admission-command';
import { deleteAdmissionCommand } from './delete-admission-command';
import { dischargeAdmissionCommand } from './discharge-admission-command';
import { transferBedCommand } from './transfer-bed-command';
import { updateAdmissionCommand } from './update-admission-command';

vi.mock('../repository/admission-repository', () => ({
  admissionRepository: {
    admitPatient: vi.fn(),
    transferBed: vi.fn(),
    cancelAdmission: vi.fn(),
    updateAdmission: vi.fn(),
    deleteAdmission: vi.fn(),
    dischargeAdmission: vi.fn(),
  },
}));
vi.mock('../validator/admit-patient-validator', () => ({
  validateAdmitPatient: vi.fn(),
}));
vi.mock('../validator/transfer-bed-validator', () => ({
  validateTransferBed: vi.fn(),
}));
vi.mock('../validator/discharge-admission-validator', () => ({
  validateDischargeAdmission: vi.fn(),
}));
vi.mock('../validator/cancel-admission-validator', () => ({
  validateCancelAdmission: vi.fn(),
}));
vi.mock('../validator/update-admission-validator', () => ({
  validateUpdateAdmission: vi.fn(),
}));
vi.mock('../validator/get-admission-by-id-validator', () => ({
  validateGetAdmissionById: vi.fn(),
}));

const repo = vi.mocked(admissionRepository);
const validateAdmit = vi.mocked(validateAdmitPatient);
const validateTransfer = vi.mocked(validateTransferBed);
const validateDischarge = vi.mocked(validateDischargeAdmission);
const validateCancel = vi.mocked(validateCancelAdmission);
const validateUpdate = vi.mocked(validateUpdateAdmission);
const validateById = vi.mocked(validateGetAdmissionById);

const admission = {
  id: 1,
  admissionNumber: 'ADM-1001',
  status: 'ADMITTED',
  bed: { id: 9, bedNumber: 'ICU-01' },
} as Admission;

const validatedAdmit = {
  tenantId: 'tenant-1',
  patientId: 7,
  doctorId: 3,
  admissionTypeId: 2,
  bedId: 9,
  bedNumber: 'ICU-01',
};

function dbError(constraint: string) {
  return Object.assign(new Error('duplicate'), { cause: { code: '23505', constraint } });
}

describe('Admission commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAdmit.mockResolvedValue({ success: true, data: validatedAdmit });
    validateTransfer.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { toBedId: 4, reason: undefined } },
    });
    validateDischarge.mockReturnValue({
      success: true,
      data: { id: 1, payload: { dischargeDisposition: 'ROUTINE', dischargeSummary: undefined } },
    });
    validateCancel.mockReturnValue({
      success: true,
      data: { id: 1, payload: { cancellationReason: 'Wrong patient' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: {
          admissionReason: undefined,
          remarks: undefined,
          expectedDischargeDate: undefined,
        },
      },
    });
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.admitPatient.mockResolvedValue({ success: true, data: admission });
    repo.transferBed.mockResolvedValue({ outcome: 'transferred', data: admission });
    repo.dischargeAdmission.mockResolvedValue({ outcome: 'updated', data: admission });
    repo.cancelAdmission.mockResolvedValue({ outcome: 'updated', data: admission });
    repo.updateAdmission.mockResolvedValue(admission);
    repo.deleteAdmission.mockResolvedValue({ outcome: 'deleted', data: admission });
  });

  describe('admitPatientCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateAdmit.mockResolvedValue({ success: false, errors: ['Bed 9 is Invalid.'] });

      const result = await admitPatientCommand({}, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Bed 9 is Invalid.'] });
      expect(repo.admitPatient).not.toHaveBeenCalled();
    });

    it('should admit with the validated data and return the admission', async () => {
      await expect(admitPatientCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: admission,
      });
      expect(repo.admitPatient).toHaveBeenCalledWith(validatedAdmit);
    });

    it('should map the bed-not-available outcome to a clean conflict', async () => {
      repo.admitPatient.mockResolvedValue({ success: false, outcome: 'bed-not-available' });

      await expect(admitPatientCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed ICU-01 is not available for admission.'],
      });
    });

    it('should map 23505 races on the partial indexes to the exact conflicts', async () => {
      repo.admitPatient.mockRejectedValue(dbError('admission_active_patient_idx'));
      await expect(admitPatientCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 7 already has an active admission.'],
      });

      repo.admitPatient.mockRejectedValue(dbError('admission_active_bed_idx'));
      await expect(admitPatientCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed ICU-01 is not available for admission.'],
      });

      repo.admitPatient.mockRejectedValue(dbError('admission_tenant_number_idx'));
      await expect(admitPatientCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Admission Number allocation conflicted. Please retry.'],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      repo.admitPatient.mockRejectedValue(new Error('boom'));

      await expect(admitPatientCommand({}, 'tenant-1')).rejects.toThrow('boom');
    });
  });

  describe('transferBedCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateTransfer.mockResolvedValue({ success: false, errors: ['Bed 4 is Invalid.'] });

      const result = await transferBedCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false });
      expect(repo.transferBed).not.toHaveBeenCalled();
    });

    it('should map every repository outcome', async () => {
      repo.transferBed.mockResolvedValue({ outcome: 'not-found' });
      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });

      repo.transferBed.mockResolvedValue({ outcome: 'invalid-status', data: admission });
      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Admission ADM-1001 cannot be transferred from its current status.'],
      });

      repo.transferBed.mockResolvedValue({ outcome: 'same-bed', data: admission });
      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Admission ADM-1001 is already in bed ICU-01.'],
      });

      repo.transferBed.mockResolvedValue({ outcome: 'bed-not-available' });
      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Bed is not available for admission.'],
      });

      repo.transferBed.mockResolvedValue({ outcome: 'transferred', data: admission });
      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admission,
      });
      expect(repo.transferBed).toHaveBeenLastCalledWith(1, 'tenant-1', 4, undefined);
    });

    it('should map a 23505 race on the active-bed index to a clean conflict', async () => {
      repo.transferBed.mockRejectedValue(dbError('admission_active_bed_idx'));

      await expect(transferBedCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Bed is not available for admission.'],
      });
    });
  });

  describe('dischargeAdmissionCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateDischarge.mockReturnValue({
        success: false,
        errors: ['Discharge disposition is Invalid.'],
      });

      const result = await dischargeAdmissionCommand('1', 'tenant-1', {});

      expect(result).toMatchObject({ success: false });
      expect(repo.dischargeAdmission).not.toHaveBeenCalled();
    });

    it('should map not-found and invalid-status outcomes', async () => {
      repo.dischargeAdmission.mockResolvedValue({ outcome: 'not-found' });
      await expect(dischargeAdmissionCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });

      repo.dischargeAdmission.mockResolvedValue({ outcome: 'invalid-status', data: admission });
      await expect(dischargeAdmissionCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Admission ADM-1001 cannot be discharged from its current status.'],
      });
    });

    it('should discharge with the parsed disposition and summary', async () => {
      await expect(dischargeAdmissionCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admission,
      });
      expect(repo.dischargeAdmission).toHaveBeenCalledWith(1, 'tenant-1', 'ROUTINE', undefined);
    });
  });

  describe('cancelAdmissionCommand', () => {
    it('should map outcomes and pass the reason through', async () => {
      repo.cancelAdmission.mockResolvedValue({ outcome: 'invalid-status', data: admission });
      await expect(cancelAdmissionCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Admission ADM-1001 cannot be cancelled from its current status.'],
      });

      repo.cancelAdmission.mockResolvedValue({ outcome: 'updated', data: admission });
      await expect(cancelAdmissionCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admission,
      });
      expect(repo.cancelAdmission).toHaveBeenLastCalledWith(1, 'tenant-1', 'Wrong patient');
    });
  });

  describe('updateAdmissionCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['Admission abc is Invalid.'] });

      const result = await updateAdmissionCommand('abc', 'tenant-1', {});

      expect(result).toMatchObject({ success: false });
      expect(repo.updateAdmission).not.toHaveBeenCalled();
    });

    it('should return not found when the row vanished after validation', async () => {
      repo.updateAdmission.mockResolvedValue(undefined);

      await expect(updateAdmissionCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the updated admission on success', async () => {
      await expect(updateAdmissionCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: admission,
      });
    });
  });

  describe('deleteAdmissionCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Admission abc is Invalid.'] });

      const result = await deleteAdmissionCommand('abc', 'tenant-1');

      expect(result).toMatchObject({ success: false });
      expect(repo.deleteAdmission).not.toHaveBeenCalled();
    });

    it('should map not-found and return the deleted admission on success', async () => {
      repo.deleteAdmission.mockResolvedValue({ outcome: 'not-found' });
      await expect(deleteAdmissionCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });

      repo.deleteAdmission.mockResolvedValue({ outcome: 'deleted', data: admission });
      await expect(deleteAdmissionCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: admission,
      });
      expect(repo.deleteAdmission).toHaveBeenLastCalledWith(1, 'tenant-1');
    });
  });
});
