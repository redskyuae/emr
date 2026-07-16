import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateCancelVisit } from '../validator/cancel-visit-validator';
import { validateCheckInVisit } from '../validator/check-in-visit-validator';
import { validateDeleteVisit } from '../validator/delete-visit-validator';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';
import { validateUpdateVisit } from '../validator/update-visit-validator';
import { cancelVisitCommand } from './cancel-visit-command';
import { checkInVisitCommand } from './check-in-visit-command';
import { completeVisitCommand } from './complete-visit-command';
import { deleteVisitCommand } from './delete-visit-command';
import { startConsultationCommand } from './start-consultation-command';
import { updateVisitCommand } from './update-visit-command';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: {
    checkInVisit: vi.fn(),
    startConsultation: vi.fn(),
    completeVisit: vi.fn(),
    cancelVisit: vi.fn(),
    updateVisit: vi.fn(),
    deleteVisit: vi.fn(),
  },
}));
vi.mock('../validator/check-in-visit-validator', () => ({ validateCheckInVisit: vi.fn() }));
vi.mock('../validator/get-visit-by-id-validator', () => ({ validateGetVisitById: vi.fn() }));
vi.mock('../validator/cancel-visit-validator', () => ({ validateCancelVisit: vi.fn() }));
vi.mock('../validator/update-visit-validator', () => ({ validateUpdateVisit: vi.fn() }));
vi.mock('../validator/delete-visit-validator', () => ({ validateDeleteVisit: vi.fn() }));

const repo = vi.mocked(visitRepository);
const validateCheckIn = vi.mocked(validateCheckInVisit);
const validateById = vi.mocked(validateGetVisitById);
const validateCancel = vi.mocked(validateCancelVisit);
const validateUpdate = vi.mocked(validateUpdateVisit);
const validateDelete = vi.mocked(validateDeleteVisit);

const visit = { id: 1, visitNumber: 'VST-1001', status: 'CHECKED_IN' } as Visit;
const checkInData = {
  tenantId: 'tenant-1',
  patientId: 7,
  doctorId: 3,
  visitTypeId: 2,
  appointmentId: 5,
  chiefComplaint: undefined,
  remarks: undefined,
  visitDate: '2026-07-16',
};

describe('Visit commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCheckIn.mockResolvedValue({ success: true, data: checkInData });
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateCancel.mockReturnValue({
      success: true,
      data: { id: 1, payload: { cancellationReason: 'Patient left' } },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { chiefComplaint: 'Fever', remarks: undefined } },
    });
    validateDelete.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.checkInVisit.mockResolvedValue({ success: true, data: visit });
    repo.startConsultation.mockResolvedValue({ outcome: 'updated', data: visit });
    repo.completeVisit.mockResolvedValue({ outcome: 'updated', data: visit });
    repo.cancelVisit.mockResolvedValue({ outcome: 'updated', data: visit });
    repo.updateVisit.mockResolvedValue(visit);
    repo.deleteVisit.mockResolvedValue(visit);
  });

  describe('checkInVisitCommand', () => {
    it('should return validation failure and not write when the validator fails', async () => {
      validateCheckIn.mockResolvedValue({ success: false, errors: ['Invalid'], status: 409 });

      const result = await checkInVisitCommand({}, 'tenant-1');

      expect(result).toEqual({ success: false, errors: ['Invalid'], status: 409 });
      expect(repo.checkInVisit).not.toHaveBeenCalled();
    });

    it('should pass the validated data to the repository', async () => {
      await checkInVisitCommand({}, 'tenant-1');

      expect(repo.checkInVisit).toHaveBeenCalledWith(checkInData);
    });

    it('should return the created visit on success', async () => {
      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
    });

    it('should map a missing checked-in appointment status to a conflict', async () => {
      repo.checkInVisit.mockResolvedValue({
        success: false,
        outcome: 'appointment-status-not-configured',
      });

      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Checked in appointment status is not configured.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should map the active-patient index race to the domain conflict message', async () => {
      repo.checkInVisit.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_active_patient_idx' },
      });

      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Patient 7 already has an active visit.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should map the appointment index race to a conflict', async () => {
      repo.checkInVisit.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_active_appointment_idx' },
      });

      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Appointment already has a visit.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should map a visit number collision to a retryable conflict', async () => {
      repo.checkInVisit.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_tenant_visit_number_idx' },
      });

      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toMatchObject({
        errors: ['Visit Number allocation conflicted. Please retry.'],
      });
    });

    it('should map a queue token collision to a retryable conflict', async () => {
      repo.checkInVisit.mockRejectedValue({
        cause: { code: '23505', constraint: 'visit_doctor_day_token_idx' },
      });

      await expect(checkInVisitCommand({}, 'tenant-1')).resolves.toMatchObject({
        errors: ['Queue Token allocation conflicted. Please retry.'],
      });
    });

    it('should rethrow unknown repository errors', async () => {
      const error = new Error('database down');
      repo.checkInVisit.mockRejectedValue(error);

      await expect(checkInVisitCommand({}, 'tenant-1')).rejects.toThrow(error);
    });

    it('should rethrow an unrelated unique violation', async () => {
      const error = { cause: { code: '23505', constraint: 'some_other_idx' } };
      repo.checkInVisit.mockRejectedValue(error);

      await expect(checkInVisitCommand({}, 'tenant-1')).rejects.toEqual(error);
    });
  });

  describe('startConsultationCommand', () => {
    it('should not call the repository when the id is invalid', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Visit abc is Invalid.'] });

      await expect(startConsultationCommand('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
      expect(repo.startConsultation).not.toHaveBeenCalled();
    });

    it('should return not found when the visit is missing', async () => {
      repo.startConsultation.mockResolvedValue({ outcome: 'not-found' });

      await expect(startConsultationCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should map an illegal transition to a conflict naming the visit', async () => {
      repo.startConsultation.mockResolvedValue({
        outcome: 'invalid-status',
        data: { ...visit, status: 'COMPLETED' } as Visit,
      });

      await expect(startConsultationCommand('1', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit VST-1001 cannot be started from its current status.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should return the updated visit on success', async () => {
      await expect(startConsultationCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
      expect(repo.startConsultation).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('completeVisitCommand', () => {
    it('should map an illegal transition to a conflict', async () => {
      repo.completeVisit.mockResolvedValue({
        outcome: 'invalid-status',
        data: { ...visit, status: 'CHECKED_IN' } as Visit,
      });

      await expect(completeVisitCommand('1', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit VST-1001 cannot be completed from its current status.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should map a missing completed appointment status to a conflict', async () => {
      repo.completeVisit.mockResolvedValue({ outcome: 'appointment-status-not-configured' });

      await expect(completeVisitCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Completed appointment status is not configured.'],
      });
    });

    it('should return the completed visit on success', async () => {
      await expect(completeVisitCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
    });
  });

  describe('cancelVisitCommand', () => {
    it('should not call the repository when validation fails', async () => {
      validateCancel.mockReturnValue({
        success: false,
        errors: ['Cancellation reason is required'],
      });

      await expect(cancelVisitCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
      });
      expect(repo.cancelVisit).not.toHaveBeenCalled();
    });

    it('should pass the reason through to the repository', async () => {
      await cancelVisitCommand('1', 'tenant-1', { cancellationReason: 'Patient left' });

      expect(repo.cancelVisit).toHaveBeenCalledWith(1, 'tenant-1', 'Patient left');
    });

    it('should map an illegal transition to a conflict', async () => {
      repo.cancelVisit.mockResolvedValue({
        outcome: 'invalid-status',
        data: { ...visit, status: 'COMPLETED' } as Visit,
      });

      await expect(cancelVisitCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: false,
        errors: ['Visit VST-1001 cannot be cancelled from its current status.'],
        status: StatusCodes.CONFLICT,
      });
    });

    it('should map a missing scheduled appointment status to a conflict', async () => {
      repo.cancelVisit.mockResolvedValue({ outcome: 'appointment-status-not-configured' });

      await expect(cancelVisitCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        errors: ['Scheduled appointment status is not configured.'],
      });
    });
  });

  describe('updateVisitCommand', () => {
    it('should not write when the validator fails', async () => {
      validateUpdate.mockResolvedValue({ success: false, errors: ['closed'], status: 409 });

      await expect(updateVisitCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: 409,
      });
      expect(repo.updateVisit).not.toHaveBeenCalled();
    });

    it('should return not found when the row disappeared before the write', async () => {
      repo.updateVisit.mockResolvedValue(undefined);

      await expect(updateVisitCommand('1', 'tenant-1', {})).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the updated visit on success', async () => {
      await expect(updateVisitCommand('1', 'tenant-1', {})).resolves.toEqual({
        success: true,
        data: visit,
      });
      expect(repo.updateVisit).toHaveBeenCalledWith(1, 'tenant-1', {
        chiefComplaint: 'Fever',
        remarks: undefined,
      });
    });
  });

  describe('deleteVisitCommand', () => {
    it('should not write when the validator fails', async () => {
      validateDelete.mockReturnValue({ success: false, errors: ['Visit abc is Invalid.'] });

      await expect(deleteVisitCommand('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
      });
      expect(repo.deleteVisit).not.toHaveBeenCalled();
    });

    it('should return not found when the row does not exist', async () => {
      repo.deleteVisit.mockResolvedValue(undefined);

      await expect(deleteVisitCommand('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('should return the deleted visit on success', async () => {
      await expect(deleteVisitCommand('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
      expect(repo.deleteVisit).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });
});
