import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitStatusRepository } from '../repository/visit-status-repository';
import { validateCreateVisitStatus } from '../validator/create-visit-status-validator';
import { validateDeleteVisitStatus } from '../validator/delete-visit-status-validator';
import { validateUpdateVisitStatus } from '../validator/update-visit-status-validator';
import { createVisitStatusCommand } from './create-visit-status-command';
import { deleteVisitStatusCommand } from './delete-visit-status-command';
import { updateVisitStatusCommand } from './update-visit-status-command';

vi.mock('../repository/visit-status-repository', () => ({
  visitStatusRepository: {
    createVisitStatus: vi.fn(),
    updateVisitStatus: vi.fn(),
    deleteVisitStatus: vi.fn(),
  },
}));
vi.mock('../validator/create-visit-status-validator', () => ({
  validateCreateVisitStatus: vi.fn(),
}));
vi.mock('../validator/update-visit-status-validator', () => ({
  validateUpdateVisitStatus: vi.fn(),
}));
vi.mock('../validator/delete-visit-status-validator', () => ({
  validateDeleteVisitStatus: vi.fn(),
}));

const repo = vi.mocked(visitStatusRepository);
const validateCreate = vi.mocked(validateCreateVisitStatus);
const validateUpdate = vi.mocked(validateUpdateVisitStatus);
const validateDelete = vi.mocked(validateDeleteVisitStatus);
const status = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Waiting',
  code: 'WAIT',
  color: '#16A34A',
  category: 'WAITING' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const payload = {
  name: 'Waiting',
  code: 'WAIT',
  color: '#16A34A',
  category: 'WAITING' as const,
  description: undefined,
};

describe('VisitStatus commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: payload });
    validateUpdate.mockResolvedValue({ success: true, data: { id: 1, payload } });
    validateDelete.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createVisitStatus.mockResolvedValue(status);
    repo.updateVisitStatus.mockResolvedValue({ outcome: 'updated', data: status });
    repo.deleteVisitStatus.mockResolvedValue({ outcome: 'deleted', data: status });
  });

  it('should return validation failure and not call repository when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createVisitStatusCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createVisitStatus).not.toHaveBeenCalled();
  });

  it('should call repository with parsed validation data plus tenant id on create', async () => {
    await createVisitStatusCommand({}, 'tenant-1');
    expect(repo.createVisitStatus).toHaveBeenCalledWith({ ...payload, tenantId: 'tenant-1' });
  });

  it('should return created data on repository success', async () => {
    await expect(createVisitStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map known Postgres unique constraint 23505 on create to conflict error', async () => {
    repo.createVisitStatus.mockRejectedValue({
      code: '23505',
      constraint: 'visit_status_tenant_name_idx',
    });
    await expect(createVisitStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Visit status name 'Waiting' already exists."],
    });
  });

  it('should map a Drizzle-wrapped Postgres 23505 error on create to conflict error', async () => {
    repo.createVisitStatus.mockRejectedValue({
      message: 'duplicate key value violates unique constraint',
      cause: { code: '23505', constraint: 'visit_status_tenant_code_idx' },
    });
    await expect(createVisitStatusCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Visit status code 'WAIT' already exists."],
    });
  });

  it('should rethrow unknown repository errors on create', async () => {
    const error = new Error('database down');
    repo.createVisitStatus.mockRejectedValue(error);
    await expect(createVisitStatusCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return updated data when update outcome is updated', async () => {
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map update outcome in-use to conflict error', async () => {
    repo.updateVisitStatus.mockResolvedValue({ outcome: 'in-use' });
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Visit status category cannot be changed while the status is in use.'],
    });
  });

  it('should map update outcome not-found to not found error', async () => {
    repo.updateVisitStatus.mockResolvedValue({ outcome: 'not-found' });
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Visit status not found'],
    });
  });

  it('should preserve update validation failure status', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Conflict'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.updateVisitStatus).not.toHaveBeenCalled();
  });

  it('should map known Postgres unique constraint 23505 on update to conflict error', async () => {
    repo.updateVisitStatus.mockRejectedValue({
      code: '23505',
      constraint: 'visit_status_tenant_name_idx',
    });
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Visit status name 'Waiting' already exists."],
    });
  });

  it('should rethrow unknown repository errors on update', async () => {
    const error = new Error('database down');
    repo.updateVisitStatus.mockRejectedValue(error);
    await expect(updateVisitStatusCommand('1', 'tenant-1', {})).rejects.toThrow(error);
  });

  it('should return validation failure and not call repository when delete validator fails', async () => {
    validateDelete.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await deleteVisitStatusCommand('1', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.deleteVisitStatus).not.toHaveBeenCalled();
  });

  it('should rethrow unknown repository errors on delete', async () => {
    const error = new Error('database down');
    repo.deleteVisitStatus.mockRejectedValue(error);
    await expect(deleteVisitStatusCommand('1', 'tenant-1')).rejects.toThrow(error);
  });

  it('should return deleted data when delete outcome is deleted', async () => {
    await expect(deleteVisitStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should map delete outcome in-use to conflict error', async () => {
    repo.deleteVisitStatus.mockResolvedValue({ outcome: 'in-use' });
    await expect(deleteVisitStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Visit status cannot be deleted while it is in use.'],
    });
  });

  it('should map delete outcome not-found to not found error', async () => {
    repo.deleteVisitStatus.mockResolvedValue({ outcome: 'not-found' });
    await expect(deleteVisitStatusCommand('1', 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Visit status not found'],
    });
  });
});
