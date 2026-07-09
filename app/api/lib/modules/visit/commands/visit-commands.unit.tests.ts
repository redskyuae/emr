import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenVisitConflictError } from '../errors/open-visit-conflict-error';
import { PatientInactiveConflictError } from '../errors/patient-inactive-conflict-error';
import { VisitStatusConflictError } from '../errors/visit-status-conflict-error';
import { visitRepository } from '../repository/visit-repository';
import { validateCreateVisit } from '../validator/create-visit-validator';
import { validateUpdateVisit } from '../validator/update-visit-validator';
import { validateStartVisit } from '../validator/start-visit-validator';
import { validateCompleteVisit } from '../validator/complete-visit-validator';
import { validateCancelVisit } from '../validator/cancel-visit-validator';
import { validateDeleteVisit } from '../validator/delete-visit-validator';
import { createVisitCommand } from './create-visit-command';
import { updateVisitCommand } from './update-visit-command';
import { startVisitCommand } from './start-visit-command';
import { completeVisitCommand } from './complete-visit-command';
import { cancelVisitCommand } from './cancel-visit-command';
import { deleteVisitCommand } from './delete-visit-command';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: {
    createVisit: vi.fn(),
    updateVisit: vi.fn(),
    deleteVisit: vi.fn(),
    updateVisitStatusTransition: vi.fn(),
  },
}));
vi.mock('../validator/create-visit-validator', () => ({
  validateCreateVisit: vi.fn(),
}));
vi.mock('../validator/update-visit-validator', () => ({
  validateUpdateVisit: vi.fn(),
}));
vi.mock('../validator/start-visit-validator', () => ({
  validateStartVisit: vi.fn(),
}));
vi.mock('../validator/complete-visit-validator', () => ({
  validateCompleteVisit: vi.fn(),
}));
vi.mock('../validator/cancel-visit-validator', () => ({
  validateCancelVisit: vi.fn(),
}));
vi.mock('../validator/delete-visit-validator', () => ({
  validateDeleteVisit: vi.fn(),
}));

const repo = vi.mocked(visitRepository);
const validateCreate = vi.mocked(validateCreateVisit);
const validateUpdate = vi.mocked(validateUpdateVisit);
const validateStart = vi.mocked(validateStartVisit);
const validateComplete = vi.mocked(validateCompleteVisit);
const validateCancel = vi.mocked(validateCancelVisit);
const validateDelete = vi.mocked(validateDeleteVisit);

const visit = {
  id: 100,
  tenantId: 'tenant-1',
  visitNumber: 'VST-1001',
  patientId: 1,
  patient: { id: 1, name: 'Asha Rao', mrn: 'MRN-1001' },
  doctorId: null,
  doctor: null,
  appointmentTypeId: 3,
  appointmentType: { id: 3, name: 'New Consultation', code: 'NEW' },
  appointmentReasonId: null,
  appointmentReason: null,
  statusId: 10,
  status: { id: 10, name: 'Waiting', code: 'WAIT', color: '#6B7280', category: 'WAITING' as const },
  chiefComplaint: null,
  notes: null,
  cancelledReason: null,
  startedOn: null,
  completedOn: null,
  cancelledOn: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Visit commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { patientId: 1, appointmentTypeId: 3, statusId: 10 },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 100, payload: { appointmentTypeId: 3 }, expectedStatusId: 10 },
    });
    validateStart.mockResolvedValue({
      success: true,
      data: { id: 100, statusId: 11, expectedStatusId: 10 },
    });
    validateComplete.mockResolvedValue({
      success: true,
      data: { id: 100, statusId: 12, expectedStatusId: 11 },
    });
    validateCancel.mockResolvedValue({
      success: true,
      data: { id: 100, statusId: 13, cancelledReason: 'Left', expectedStatusId: 10 },
    });
    validateDelete.mockResolvedValue({ success: true, data: { id: 100, tenantId: 'tenant-1' } });
    repo.createVisit.mockResolvedValue(visit);
    repo.updateVisit.mockResolvedValue(visit);
    repo.deleteVisit.mockResolvedValue(visit);
    repo.updateVisitStatusTransition.mockResolvedValue(visit);
  });

  it('should return validation failure and not call repository on create failure', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createVisitCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createVisit).not.toHaveBeenCalled();
  });

  it('should call repository with validated data plus tenant id on create', async () => {
    await createVisitCommand({}, 'tenant-1');
    expect(repo.createVisit).toHaveBeenCalledWith({
      patientId: 1,
      appointmentTypeId: 3,
      statusId: 10,
      tenantId: 'tenant-1',
    });
  });

  it('should return created visit on success', async () => {
    await expect(createVisitCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should map a repository-level open visit conflict to a clean conflict error', async () => {
    repo.createVisit.mockRejectedValue(new OpenVisitConflictError('VST-1001'));
    const result = await createVisitCommand({}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: [
        'Patient already has an Open Visit (VST-1001). Complete or cancel it before starting a new Visit.',
      ],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should map a repository-level inactive patient conflict to a clean conflict error', async () => {
    repo.createVisit.mockRejectedValue(new PatientInactiveConflictError());
    const result = await createVisitCommand({}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit patient is Inactive and cannot be selected for a new Visit.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should rethrow unknown repository errors on create', async () => {
    const error = new Error('database down');
    repo.createVisit.mockRejectedValue(error);
    await expect(createVisitCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return validation failure and not call repository on update failure', async () => {
    validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await updateVisitCommand('100', 'tenant-1', {});
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.updateVisit).not.toHaveBeenCalled();
  });

  it('should return not found when update repository returns undefined', async () => {
    repo.updateVisit.mockResolvedValue(undefined);
    const result = await updateVisitCommand('100', 'tenant-1', {});
    expect(result).toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should call repository with the expected status id observed at validation on update', async () => {
    await updateVisitCommand('100', 'tenant-1', {});
    expect(repo.updateVisit).toHaveBeenCalledWith(100, {
      appointmentTypeId: 3,
      tenantId: 'tenant-1',
      expectedStatusId: 10,
    });
  });

  it('should return updated visit on success', async () => {
    await expect(updateVisitCommand('100', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should map a concurrent terminal transition to a clean conflict error on update', async () => {
    repo.updateVisit.mockRejectedValue(new VisitStatusConflictError());
    const result = await updateVisitCommand('100', 'tenant-1', {});
    expect(result).toEqual({
      success: false,
      errors: ['Visit status changed since it was loaded. Reload and try again.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should rethrow unknown repository errors on update', async () => {
    const error = new Error('database down');
    repo.updateVisit.mockRejectedValue(error);
    await expect(updateVisitCommand('100', 'tenant-1', {})).rejects.toThrow(error);
  });

  it('should call updateVisitStatusTransition with startedOn on start', async () => {
    await startVisitCommand('100', {}, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 11,
      expectedStatusId: 10,
      timestampField: 'startedOn',
    });
  });

  it('should propagate start validation failure', async () => {
    validateStart.mockResolvedValue({
      success: false,
      errors: ['Bad'],
      status: StatusCodes.CONFLICT,
    });
    const result = await startVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Bad'], status: StatusCodes.CONFLICT });
    expect(repo.updateVisitStatusTransition).not.toHaveBeenCalled();
  });

  it('should map a concurrent status change to a clean conflict error on start', async () => {
    repo.updateVisitStatusTransition.mockRejectedValue(new VisitStatusConflictError());
    const result = await startVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit status changed since it was loaded. Reload and try again.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should return started visit on success', async () => {
    await expect(startVisitCommand('100', {}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should rethrow unknown repository errors on start', async () => {
    const error = new Error('database down');
    repo.updateVisitStatusTransition.mockRejectedValue(error);
    await expect(startVisitCommand('100', {}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return validation failure and not call repository on complete failure', async () => {
    validateComplete.mockResolvedValue({
      success: false,
      errors: ['Bad'],
      status: StatusCodes.CONFLICT,
    });
    const result = await completeVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Bad'], status: StatusCodes.CONFLICT });
    expect(repo.updateVisitStatusTransition).not.toHaveBeenCalled();
  });

  it('should call updateVisitStatusTransition with completedOn on complete', async () => {
    await completeVisitCommand('100', {}, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 12,
      expectedStatusId: 11,
      timestampField: 'completedOn',
    });
  });

  it('should return completed visit on success', async () => {
    await expect(completeVisitCommand('100', {}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should map a concurrent status change to a clean conflict error on complete', async () => {
    repo.updateVisitStatusTransition.mockRejectedValue(new VisitStatusConflictError());
    const result = await completeVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit status changed since it was loaded. Reload and try again.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should return validation failure and not call repository on cancel failure', async () => {
    validateCancel.mockResolvedValue({
      success: false,
      errors: ['Bad'],
      status: StatusCodes.CONFLICT,
    });
    const result = await cancelVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Bad'], status: StatusCodes.CONFLICT });
    expect(repo.updateVisitStatusTransition).not.toHaveBeenCalled();
  });

  it('should call updateVisitStatusTransition with cancelledOn and reason on cancel', async () => {
    await cancelVisitCommand('100', { cancelledReason: 'Left' }, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 13,
      expectedStatusId: 10,
      timestampField: 'cancelledOn',
      cancelledReason: 'Left',
    });
  });

  it('should return cancelled visit on success', async () => {
    await expect(
      cancelVisitCommand('100', { cancelledReason: 'Left' }, 'tenant-1')
    ).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should map a concurrent status change to a clean conflict error on cancel', async () => {
    repo.updateVisitStatusTransition.mockRejectedValue(new VisitStatusConflictError());
    const result = await cancelVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit status changed since it was loaded. Reload and try again.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should return not found when a transition repository call returns undefined', async () => {
    repo.updateVisitStatusTransition.mockResolvedValue(undefined);
    const result = await startVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should return validation failure and not call repository on delete failure', async () => {
    validateDelete.mockResolvedValue({ success: false, errors: ['Invalid'], status: 404 });
    const result = await deleteVisitCommand('100', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 404 });
    expect(repo.deleteVisit).not.toHaveBeenCalled();
  });

  it('should return void on delete success', async () => {
    await expect(deleteVisitCommand('100', 'tenant-1')).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });

  it('should return not found when delete repository returns undefined', async () => {
    repo.deleteVisit.mockResolvedValue(undefined);
    const result = await deleteVisitCommand('100', 'tenant-1');
    expect(result).toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });
});
