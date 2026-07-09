import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
      data: { id: 100, payload: { appointmentTypeId: 3 } },
    });
    validateStart.mockResolvedValue({ success: true, data: { id: 100, statusId: 11 } });
    validateComplete.mockResolvedValue({ success: true, data: { id: 100, statusId: 12 } });
    validateCancel.mockResolvedValue({
      success: true,
      data: { id: 100, statusId: 13, cancelledReason: 'Left' },
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

  it('should return not found when update repository returns undefined', async () => {
    repo.updateVisit.mockResolvedValue(undefined);
    const result = await updateVisitCommand('100', 'tenant-1', {});
    expect(result).toEqual({ success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND });
  });

  it('should return updated visit on success', async () => {
    await expect(updateVisitCommand('100', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should call updateVisitStatusTransition with startedOn on start', async () => {
    await startVisitCommand('100', {}, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 11,
      timestampField: 'startedOn',
    });
  });

  it('should propagate start validation failure', async () => {
    validateStart.mockResolvedValue({ success: false, errors: ['Bad'], status: StatusCodes.CONFLICT });
    const result = await startVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Bad'], status: StatusCodes.CONFLICT });
    expect(repo.updateVisitStatusTransition).not.toHaveBeenCalled();
  });

  it('should call updateVisitStatusTransition with completedOn on complete', async () => {
    await completeVisitCommand('100', {}, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 12,
      timestampField: 'completedOn',
    });
  });

  it('should call updateVisitStatusTransition with cancelledOn and reason on cancel', async () => {
    await cancelVisitCommand('100', { cancelledReason: 'Left' }, 'tenant-1');
    expect(repo.updateVisitStatusTransition).toHaveBeenCalledWith(100, 'tenant-1', {
      statusId: 13,
      timestampField: 'cancelledOn',
      cancelledReason: 'Left',
    });
  });

  it('should return not found when a transition repository call returns undefined', async () => {
    repo.updateVisitStatusTransition.mockResolvedValue(undefined);
    const result = await startVisitCommand('100', {}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND });
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
    expect(result).toEqual({ success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND });
  });
});
